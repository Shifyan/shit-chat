package domain

import "time"

// Chat represents a conversation (1:1 or group).
type Chat struct {
	ID        int64     `json:"id"`
	Name      *string   `json:"name"`
	IsGroup   bool      `json:"is_group"`
	CreatedBy int64     `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

// ChatMember represents a user's membership in a chat.
type ChatMember struct {
	ChatID     int64      `json:"chat_id"`
	UserID     int64      `json:"user_id"`
	LastReadAt *time.Time `json:"last_read_at"`
	JoinedAt   time.Time  `json:"joined_at"`
}

// Message represents a single chat message.
type Message struct {
	ID        int64     `json:"id"`
	ChatID    int64     `json:"chat_id"`
	SenderID  int64     `json:"sender_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}

// MessageWithSender includes the sender's name for display.
type MessageWithSender struct {
	ID         int64     `json:"id"`
	ChatID     int64     `json:"chat_id"`
	SenderID   int64     `json:"sender_id"`
	SenderName string    `json:"sender_name"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"created_at"`
}

// UserBrief is a light user reference for chat lists.
type UserBrief struct {
	ID       int64  `json:"id"`
	Fullname string `json:"fullname"`
	Email    string `json:"email"`
}

// ChatSummary is the enriched chat list item returned to the frontend.
type ChatSummary struct {
	ID           int64      `json:"id"`
	Name         *string    `json:"name"`
	IsGroup      bool       `json:"is_group"`
	OtherUser    *UserBrief `json:"other_user,omitempty"`
	LastMessage  *MessageWithSender `json:"last_message,omitempty"`
	UnreadCount  int        `json:"unread_count"`
	LastReadAt   *time.Time `json:"last_read_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

// MessagesResponse is the paginated message history response.
type MessagesResponse struct {
	Messages      []MessageWithSender `json:"messages"`
	NextBeforeID  *int64              `json:"next_before_id"`
}

// CreateChatRequest is the request body for creating a chat.
type CreateChatRequest struct {
	UserID    *int64  `json:"user_id"`    // for 1:1 chats
	Name      *string `json:"name"`       // for group chats
	MemberIDs []int64 `json:"member_ids"` // for group chats
}

// MarkReadRequest marks a chat as read up to a given message.
type MarkReadRequest struct {
	LastReadMessageID int64 `json:"last_read_message_id"`
}
