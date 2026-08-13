package ws

import (
	"backend/internal/domain"
	"backend/pkg/jwt"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// MessageService defines the interface the WS handler needs for persistence.
type MessageService interface {
	SendMessage(chatID, senderID int64, body string) (*domain.MessageWithSender, error)
	GetMessages(chatID, userID int64, beforeID *int64, limit int) (*domain.MessagesResponse, error)
	IsMember(chatID, userID int64) (bool, error)
	MarkRead(chatID, userID int64) error
	GetChats(userID int64) ([]domain.ChatSummary, error)
	GetMembers(chatID int64) ([]int64, error)
}

// Handler handles WebSocket upgrade and message routing.
type Handler struct {
	hub          *Hub
	chatService  MessageService
}

// NewHandler creates a new WS handler.
func NewHandler(hub *Hub, chatService MessageService) *Handler {
	return &Handler{hub: hub, chatService: chatService}
}

// ServeWS handles the WebSocket upgrade request.
func (h *Handler) ServeWS(c *gin.Context) {
	// Authenticate via cookie
	token, err := c.Cookie("token")
	if err != nil || token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	userIDStr, err := jwt.ValidateToken(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token"})
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid token payload"})
		return
	}

	// Upgrade to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("ws upgrade failed: %v", err)
		return
	}

	// Load user's chat memberships
	chats, err := h.chatService.GetChats(userID)
	if err != nil {
		log.Printf("ws: failed to load chats for user %d: %v", userID, err)
		conn.Close()
		return
	}

	// Create client
	client := &Client{
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		hub:    h.hub,
	}

	h.hub.register <- client

	// Join all chat rooms for this user
	for _, chat := range chats {
		h.hub.JoinChat(client, chat.ID)
	}

	// Send initial presence for all members of user's chats
	memberIDs := make(map[int64]bool)
	for _, chat := range chats {
		members, err := h.chatService.GetMembers(chat.ID)
		if err != nil {
			continue
		}
		for _, mid := range members {
			if mid != userID {
				memberIDs[mid] = true
			}
		}
	}
	presence := h.hub.GetPresence(intSlice(memberIDs))
	for uid, online := range presence {
		msg := &WSMessage{
			Type:   "presence",
			UserID: &uid,
			Online: &online,
		}
		data, _ := json.Marshal(msg)
		select {
		case client.send <- data:
		default:
		}
	}

	// Start read/write pumps
	go client.writePump()
	go client.readPumpWithHandler(h)
}

// readPumpWithHandler starts the client read loop with message dispatching.
func (c *Client) readPumpWithHandler(h *Handler) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var msg WSMessage
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			if IsUnexpectedClose(err) {
				log.Printf("ws error for user %d: %v", c.userID, err)
			}
			break
		}

		h.dispatch(c, &msg)
	}
}

// dispatch routes an incoming message to the correct handler.
func (h *Handler) dispatch(client *Client, msg *WSMessage) {
	switch msg.Type {
	case "message":
		h.handleMessage(client, msg)
	case "typing":
		h.handleTyping(client, msg)
	case "read":
		h.handleRead(client, msg)
	case "join_chat":
		h.handleJoinChat(client, msg)
	case "ping":
		h.hub.SendToClient(client, &WSMessage{Type: "pong"})
	default:
		h.hub.SendToClient(client, &WSMessage{
			Type:    "error",
			Code:    strPtr("unknown_type"),
			Message: strPtr("Unknown message type: " + msg.Type),
		})
	}
}

// handleMessage persists a message and broadcasts it.
func (h *Handler) handleMessage(client *Client, msg *WSMessage) {
	if msg.ChatID == nil || msg.Body == nil || msg.TempID == nil {
		h.hub.SendToClient(client, &WSMessage{
			Type:    "error",
			Code:    strPtr("invalid_message"),
			Message: strPtr("chat_id, body, and temp_id are required"),
		})
		return
	}

	// Persist to DB
	result, err := h.chatService.SendMessage(*msg.ChatID, client.userID, *msg.Body)
	if err != nil {
		h.hub.SendToClient(client, &WSMessage{
			Type:    "error",
			Code:    strPtr("send_failed"),
			Message: strPtr(err.Error()),
			TempID:  msg.TempID,
		})
		return
	}

	// Format broadcast
	createdAt := result.CreatedAt.Format("2006-01-02T15:04:05Z07:00")
	broadcast := map[string]interface{}{
		"type": "message",
		"message": map[string]interface{}{
			"id":          result.ID,
			"chat_id":     result.ChatID,
			"sender_id":   result.SenderID,
			"sender_name": result.SenderName,
			"body":        result.Body,
			"created_at":  createdAt,
		},
	}

	// Ack to sender (with temp_id for dedup)
	ack := map[string]interface{}{
		"type":    "ack",
		"temp_id": *msg.TempID,
		"message": map[string]interface{}{
			"id":          result.ID,
			"chat_id":     result.ChatID,
			"sender_id":   result.SenderID,
			"sender_name": result.SenderName,
			"body":        result.Body,
			"created_at":  createdAt,
		},
	}
	h.hub.SendToClient(client, ack)

	// Broadcast to room (excluding sender)
	h.hub.BroadcastToRoom(*msg.ChatID, client.userID, broadcast)
}

// handleJoinChat adds the client to a chat room at runtime (for chats created
// after the initial connection). Membership is verified against the DB.
func (h *Handler) handleJoinChat(client *Client, msg *WSMessage) {
	if msg.ChatID == nil {
		return
	}

	isMember, err := h.chatService.IsMember(*msg.ChatID, client.userID)
	if err != nil {
		h.hub.SendToClient(client, &WSMessage{
			Type:    "error",
			Code:    strPtr("join_failed"),
			Message: strPtr(err.Error()),
		})
		return
	}
	if !isMember {
		h.hub.SendToClient(client, &WSMessage{
			Type:    "error",
			Code:    strPtr("not_member"),
			Message: strPtr("You are not a member of this chat"),
		})
		return
	}

	h.hub.JoinChat(client, *msg.ChatID)
}

// handleTyping broadcasts typing status.
func (h *Handler) handleTyping(client *Client, msg *WSMessage) {
	if msg.ChatID == nil || msg.IsTyping == nil {
		return
	}
	h.hub.BroadcastToRoom(*msg.ChatID, client.userID, &WSMessage{
		Type:     "typing",
		ChatID:   msg.ChatID,
		UserID:   &client.userID,
		IsTyping: msg.IsTyping,
	})
}

// handleRead marks chat as read and broadcasts read receipt.
func (h *Handler) handleRead(client *Client, msg *WSMessage) {
	if msg.ChatID == nil {
		return
	}
	_ = h.chatService.MarkRead(*msg.ChatID, client.userID)

	// Broadcast to ALL members including the reader — their own sidebar needs
	// the event to clear the unread badge immediately.
	h.hub.BroadcastToRoom(*msg.ChatID, 0, &WSMessage{
		Type:              "read",
		ChatID:            msg.ChatID,
		UserID:            &client.userID,
		LastReadMessageID: msg.LastReadMessageID,
	})
}

// IsUnexpectedClose checks if a websocket close error is unexpected.
func IsUnexpectedClose(err error) bool {
	type closeError interface {
		Code() int
	}
	if ce, ok := err.(closeError); ok {
		code := ce.Code()
		return code != 1000 && code != 1001 // not normal or going away
	}
	return true
}

func intSlice(m map[int64]bool) []int64 {
	keys := make([]int64, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}
