package ws

import (
	"encoding/json"
	"log"
	"sync"
)

// Hub maintains the set of active clients and rooms.
// A user may have MULTIPLE connections (multiple tabs) — each is a separate
// Client, and broadcast goes to every connection of every member.
type Hub struct {
	mu         sync.RWMutex
	rooms      map[int64]*Room          // chatID → Room
	users      map[int64]map[*Client]struct{} // userID → set of connections
	register   chan *Client
	unregister chan *Client
	presence   map[int64]bool // userID → online (≥1 connection)
}

// Room holds connections of members in a chat room.
type Room struct {
	clients map[int64]map[*Client]struct{}
}

// NewHub creates a new Hub.
func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[int64]*Room),
		users:      make(map[int64]map[*Client]struct{}),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		presence:   make(map[int64]bool),
	}
}

// Run starts the hub's main event loop.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.addClientToUserMap(client)
			h.presence[client.userID] = true
			h.mu.Unlock()
			h.broadcastPresence(client.userID, true)

		case client := <-h.unregister:
			h.mu.Lock()
			if h.removeClient(client) {
				delete(h.presence, client.userID)
			}
			close(client.send)
			h.mu.Unlock()
			h.broadcastPresence(client.userID, false)
		}
	}
}

// JoinChat adds a client to a chat room (and the user map).
func (h *Hub) JoinChat(client *Client, chatID int64) {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, ok := h.rooms[chatID]
	if !ok {
		room = &Room{clients: make(map[int64]map[*Client]struct{})}
		h.rooms[chatID] = room
	}

	if room.clients[client.userID] == nil {
		room.clients[client.userID] = make(map[*Client]struct{})
	}
	room.clients[client.userID][client] = struct{}{}

	h.addClientToUserMap(client)
}

// RemoveClientFromRoom removes one connection from a chat room.
func (h *Hub) RemoveClientFromRoom(client *Client, chatID int64) {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, ok := h.rooms[chatID]
	if !ok {
		return
	}
	if conns, ok := room.clients[client.userID]; ok {
		delete(conns, client)
		if len(conns) == 0 {
			delete(room.clients, client.userID)
		}
		if len(room.clients) == 0 {
			delete(h.rooms, chatID)
		}
	}
}

// BroadcastToRoom sends a JSON-marshalable payload to ALL connections of every
// member in a room, optionally excluding one user.
func (h *Hub) BroadcastToRoom(chatID int64, excludeUserID int64, payload interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	room, ok := h.rooms[chatID]
	if !ok {
		return
	}

	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("hub: marshal error: %v", err)
		return
	}

	for userID, conns := range room.clients {
		if userID == excludeUserID {
			continue
		}
		for client := range conns {
			h.sendData(client, data)
		}
	}
}

// SendToUser sends a payload to ALL connections of a user.
func (h *Hub) SendToUser(userID int64, payload interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns, ok := h.users[userID]
	if !ok {
		return
	}

	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("hub: marshal error: %v", err)
		return
	}

	for client := range conns {
		h.sendData(client, data)
	}
}

// SendToClient sends a payload to a specific connection.
func (h *Hub) SendToClient(client *Client, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		log.Printf("hub: marshal error for client %d: %v", client.userID, err)
		return
	}
	h.mu.RLock()
	h.sendData(client, data)
	h.mu.RUnlock()
}

// IsUserOnline returns whether a user has at least one active connection.
func (h *Hub) IsUserOnline(userID int64) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.presence[userID]
}

// GetPresence returns a map of userID → online.
func (h *Hub) GetPresence(userIDs []int64) map[int64]bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	result := make(map[int64]bool, len(userIDs))
	for _, uid := range userIDs {
		result[uid] = h.presence[uid]
	}
	return result
}

// --- internal helpers (callers must hold the lock where needed) ---

func (h *Hub) addClientToUserMap(client *Client) {
	if h.users[client.userID] == nil {
		h.users[client.userID] = make(map[*Client]struct{})
	}
	h.users[client.userID][client] = struct{}{}
}

// removeClient removes a connection from the user map and all rooms.
// Returns true if the user now has zero connections (went offline).
func (h *Hub) removeClient(client *Client) bool {
	// Remove from all rooms
	for chatID, room := range h.rooms {
		if conns, ok := room.clients[client.userID]; ok {
			delete(conns, client)
			if len(conns) == 0 {
				delete(room.clients, client.userID)
			}
			if len(room.clients) == 0 {
				delete(h.rooms, chatID)
			}
		}
	}

	// Remove from user map
	if conns, ok := h.users[client.userID]; ok {
		delete(conns, client)
		if len(conns) == 0 {
			delete(h.users, client.userID)
			return true // user fully offline
		}
	}
	return false
}

// sendData writes to a client's buffered channel without blocking.
// Caller must hold h.mu (RLock or Lock).
func (h *Hub) sendData(client *Client, data []byte) {
	select {
	case client.send <- data:
	default:
		// Buffer full — drop this connection
		go func(c *Client) {
			h.unregister <- c
		}(client)
	}
}

func (h *Hub) broadcastPresence(userID int64, online bool) {
	msg := &WSMessage{
		Type:   "presence",
		UserID: &userID,
		Online: &online,
	}
	data, _ := json.Marshal(msg)

	h.mu.RLock()
	defer h.mu.RUnlock()

	for _, room := range h.rooms {
		for _, conns := range room.clients {
			for client := range conns {
				if client.userID == userID {
					continue
				}
				select {
				case client.send <- data:
				default:
				}
			}
		}
	}
}
