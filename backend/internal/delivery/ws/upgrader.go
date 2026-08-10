package ws

import (
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024 * 1024, // 1MB
	WriteBufferSize: 512 * 1024,  // 512KB
	CheckOrigin: func(r *http.Request) bool {
		// Allow requests without Origin header (server-side/native clients)
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true
		}
		return origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000"
	},
}

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 4096
)

// WSMessage is the JSON protocol for WebSocket communication.
type WSMessage struct {
	Type string `json:"type"`

	// message
	ChatID   *int64  `json:"chat_id,omitempty"`
	TempID   *string `json:"temp_id,omitempty"`
	Body     *string `json:"body,omitempty"`

	// typing
	IsTyping *bool `json:"is_typing,omitempty"`

	// read
	LastReadMessageID *int64 `json:"last_read_message_id,omitempty"`

	// presence
	UserID *int64 `json:"user_id,omitempty"`
	Online *bool  `json:"online,omitempty"`

	// error
	Code    *string `json:"code,omitempty"`
	Message *string `json:"message,omitempty"`

	// message broadcast
	SenderID   *int64  `json:"sender_id,omitempty"`
	SenderName *string `json:"sender_name,omitempty"`
	CreatedAt  *string `json:"created_at,omitempty"`
}

// strPtr returns a pointer to the given string.
func strPtr(s string) *string {
	return &s
}
