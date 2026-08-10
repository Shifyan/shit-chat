package repository

import (
	"backend/internal/domain"
	"database/sql"
	"time"
)

type MessageRepository struct {
	db *sql.DB
}

func NewMessageRepository(db *sql.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

// CreateMessage inserts a new message and returns it with the server-assigned ID and timestamp.
func (r *MessageRepository) CreateMessage(chatID, senderID int64, body string) (*domain.MessageWithSender, error) {
	var m domain.MessageWithSender
	err := r.db.QueryRow(`
		INSERT INTO messages (chat_id, sender_id, body, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, chat_id, sender_id, body, created_at`,
		chatID, senderID, body, time.Now(),
	).Scan(&m.ID, &m.ChatID, &m.SenderID, &m.Body, &m.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Fetch sender name
	err = r.db.QueryRow(`SELECT fullname FROM users WHERE id = $1`, senderID).Scan(&m.SenderName)
	if err != nil {
		m.SenderName = "Unknown"
	}

	return &m, nil
}

// ListMessages returns paginated message history, newest first in the DB,
// then reversed to chronological order for display.
func (r *MessageRepository) ListMessages(chatID int64, beforeID *int64, limit int) (*domain.MessagesResponse, error) {
	var rows *sql.Rows
	var err error

	if beforeID != nil {
		rows, err = r.db.Query(`
			SELECT m.id, m.chat_id, m.sender_id, u.fullname, m.body, m.created_at
			FROM messages m
			JOIN users u ON u.id = m.sender_id
			WHERE m.chat_id = $1 AND m.id < $2
			ORDER BY m.id DESC
			LIMIT $3`, chatID, *beforeID, limit+1)
	} else {
		rows, err = r.db.Query(`
			SELECT m.id, m.chat_id, m.sender_id, u.fullname, m.body, m.created_at
			FROM messages m
			JOIN users u ON u.id = m.sender_id
			WHERE m.chat_id = $1
			ORDER BY m.id DESC
			LIMIT $2`, chatID, limit+1)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []domain.MessageWithSender
	for rows.Next() {
		var m domain.MessageWithSender
		if err := rows.Scan(&m.ID, &m.ChatID, &m.SenderID, &m.SenderName, &m.Body, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	resp := &domain.MessagesResponse{}

	// Check if there are more pages
	if len(messages) > limit {
		resp.NextBeforeID = &messages[limit-1].ID
		messages = messages[:limit]
	}

	// Reverse to chronological order (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	resp.Messages = messages
	if resp.Messages == nil {
		resp.Messages = []domain.MessageWithSender{}
	}

	return resp, nil
}

// GetMessageByID returns a single message with sender name.
func (r *MessageRepository) GetMessageByID(msgID int64) (*domain.MessageWithSender, error) {
	var m domain.MessageWithSender
	err := r.db.QueryRow(`
		SELECT m.id, m.chat_id, m.sender_id, u.fullname, m.body, m.created_at
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE m.id = $1`, msgID,
	).Scan(&m.ID, &m.ChatID, &m.SenderID, &m.SenderName, &m.Body, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}
