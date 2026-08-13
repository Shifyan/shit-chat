package http

import (
	"backend/internal/domain"
	"backend/internal/usecase"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ChatEventBroadcaster pushes real-time events over WebSocket.
// Implemented by ws.Hub in production.
type ChatEventBroadcaster interface {
	SendToUser(userID int64, payload interface{})
}

type ChatController struct {
	chatService *usecase.ChatService
	events      ChatEventBroadcaster
}

func NewChatController(s *usecase.ChatService, events ChatEventBroadcaster) *ChatController {
	return &ChatController{chatService: s, events: events}
}

// ListChats returns all chats for the authenticated user.
func (ctrl *ChatController) ListChats(c *gin.Context) {
	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	chats, err := ctrl.chatService.GetChats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to fetch chats"})
		return
	}

	if chats == nil {
		chats = []domain.ChatSummary{}
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

// CreateChat creates a new 1:1 chat or gets existing one.
func (ctrl *ChatController) CreateChat(c *gin.Context) {
	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	var req domain.CreateChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
		return
	}

	var chat *domain.Chat
	var err error

	if req.Name != nil || len(req.MemberIDs) > 0 {
		// Group chat
		var name string
		if req.Name != nil {
			name = *req.Name
		}
		chat, err = ctrl.chatService.CreateGroupChat(userID, name, req.MemberIDs)
	} else {
		// Direct chat
		if req.UserID == nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "user_id is required"})
			return
		}
		chat, err = ctrl.chatService.CreateDirectChat(userID, *req.UserID)
	}

	if err != nil {
		status := http.StatusInternalServerError
		switch err.Error() {
		case "cannot chat with yourself":
			status = http.StatusBadRequest
		case "user not found":
			status = http.StatusNotFound
		case "group name is required", "group needs at least one other member":
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"message": err.Error()})
		return
	}

	// Notify all other members in real time so the new chat appears in their
	// conversation list without waiting for polling.
	if ctrl.events != nil {
		if memberIDs, err := ctrl.chatService.GetMembers(chat.ID); err == nil {
			for _, mid := range memberIDs {
				if mid == userID {
					continue
				}
				if summary, err := ctrl.chatService.GetChatSummary(chat.ID, mid); err == nil {
					ctrl.events.SendToUser(mid, gin.H{
						"type": "chat_created",
						"chat": summary,
					})
				}
			}
		}
	}

	c.JSON(http.StatusCreated, gin.H{"chat": chat})
}

// GetMessages returns paginated message history for a chat.
func (ctrl *ChatController) GetMessages(c *gin.Context) {
	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	chatID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid chat ID"})
		return
	}

	var beforeID *int64
	if v := c.Query("before_id"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err == nil {
			beforeID = &id
		}
	}

	limit := 50
	if v := c.Query("limit"); v != "" {
		if l, err := strconv.Atoi(v); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	resp, err := ctrl.chatService.GetMessages(chatID, userID, beforeID, limit)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// MarkRead marks a chat as read for the authenticated user.
func (ctrl *ChatController) MarkRead(c *gin.Context) {
	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	chatID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid chat ID"})
		return
	}

	if err := ctrl.chatService.MarkRead(chatID, userID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}
