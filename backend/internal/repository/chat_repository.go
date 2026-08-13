package repository

import (
	"backend/internal/domain"
	"database/sql"
	"time"
)

type ChatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

// GetOrCreateDirectChat finds an existing 1:1 chat between two users,
// or creates one in a transaction if none exists.
func (r *ChatRepository) GetOrCreateDirectChat(userA, userB int64) (*domain.Chat, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Check if a 1:1 chat already exists between these users
	query := `
		SELECT c.id, c.name, c.is_group, c.created_by, c.created_at
		FROM chats c
		JOIN chat_members m1 ON m1.chat_id = c.id AND m1.user_id = $1
		JOIN chat_members m2 ON m2.chat_id = c.id AND m2.user_id = $2
		WHERE c.is_group = FALSE
		LIMIT 1`

	var chat domain.Chat
	err = tx.QueryRow(query, userA, userB).Scan(
		&chat.ID, &chat.Name, &chat.IsGroup, &chat.CreatedBy, &chat.CreatedAt,
	)
	if err == nil {
		tx.Commit()
		return &chat, nil
	}
	if err != sql.ErrNoRows {
		return nil, err
	}

	// Create new 1:1 chat
	now := time.Now()
	err = tx.QueryRow(
		`INSERT INTO chats (name, is_group, created_by, created_at) VALUES (NULL, FALSE, $1, $2) RETURNING id`,
		userA, now,
	).Scan(&chat.ID)
	if err != nil {
		return nil, err
	}
	chat.IsGroup = false
	chat.CreatedBy = userA
	chat.CreatedAt = now

	// Add both members
	for _, uid := range []int64{userA, userB} {
		_, err = tx.Exec(
			`INSERT INTO chat_members (chat_id, user_id, last_read_at, joined_at) VALUES ($1, $2, $3, $4)`,
			chat.ID, uid, now, now,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return &chat, nil
}

// CreateGroupChat creates a group chat with the given members (creator included).
func (r *ChatRepository) CreateGroupChat(creatorID int64, name string, memberIDs []int64) (*domain.Chat, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	now := time.Now()
	var chat domain.Chat
	err = tx.QueryRow(
		`INSERT INTO chats (name, is_group, created_by, created_at) VALUES ($1, TRUE, $2, $3) RETURNING id`,
		name, creatorID, now,
	).Scan(&chat.ID)
	if err != nil {
		return nil, err
	}
	chat.Name = &name
	chat.IsGroup = true
	chat.CreatedBy = creatorID
	chat.CreatedAt = now

	members := append([]int64{creatorID}, memberIDs...)
	for _, uid := range members {
		if _, err = tx.Exec(
			`INSERT INTO chat_members (chat_id, user_id, last_read_at, joined_at) VALUES ($1, $2, $3, $4)`,
			chat.ID, uid, now, now,
		); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &chat, nil
}

// IsMember checks whether a user belongs to a chat.
func (r *ChatRepository) IsMember(chatID, userID int64) (bool, error) {
	var exists bool
	err := r.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM chat_members WHERE chat_id = $1 AND user_id = $2)`,
		chatID, userID,
	).Scan(&exists)
	return exists, err
}

// GetMembers returns all member IDs for a chat.
func (r *ChatRepository) GetMembers(chatID int64) ([]int64, error) {
	rows, err := r.db.Query(`SELECT user_id FROM chat_members WHERE chat_id = $1`, chatID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// ListChatsForUser returns all chats for a user, enriched with last message,
// other member info (for 1:1), and unread count.
func (r *ChatRepository) ListChatsForUser(userID int64) ([]domain.ChatSummary, error) {
	query := `
		SELECT
			c.id, c.name, c.is_group, c.created_at,
			cm.last_read_at,
			COALESCE(
				(SELECT COUNT(*) FROM messages m2
				 WHERE m2.chat_id = c.id
				 AND m2.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
				 AND m2.sender_id != $1),
				0
			) AS unread_count
		FROM chats c
		JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = $1
		ORDER BY c.created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []domain.ChatSummary
	for rows.Next() {
		var s domain.ChatSummary
		if err := rows.Scan(&s.ID, &s.Name, &s.IsGroup, &s.CreatedAt, &s.LastReadAt, &s.UnreadCount); err != nil {
			return nil, err
		}

		enriched, err := r.enrichChatSummary(&s, userID)
		if err != nil {
			continue
		}
		summaries = append(summaries, *enriched)
	}
	return summaries, rows.Err()
}

// GetChatSummary returns a single enriched chat summary for a user (used to
// build the chat_created websocket payload).
func (r *ChatRepository) GetChatSummary(chatID, userID int64) (*domain.ChatSummary, error) {
	var s domain.ChatSummary
	err := r.db.QueryRow(`
		SELECT c.id, c.name, c.is_group, c.created_at, cm.last_read_at,
			COALESCE(
				(SELECT COUNT(*) FROM messages m2
				 WHERE m2.chat_id = c.id
				 AND m2.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
				 AND m2.sender_id != $1),
				0
			) AS unread_count
		FROM chats c
		JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = $1
		WHERE c.id = $2`, userID, chatID,
	).Scan(&s.ID, &s.Name, &s.IsGroup, &s.CreatedAt, &s.LastReadAt, &s.UnreadCount)
	if err != nil {
		return nil, err
	}
	return r.enrichChatSummary(&s, userID)
}

// enrichChatSummary fills in other-user info (1:1), their read watermark,
// and the last message.
func (r *ChatRepository) enrichChatSummary(s *domain.ChatSummary, userID int64) (*domain.ChatSummary, error) {
	if !s.IsGroup {
		other, err := r.getOtherMember(s.ID, userID)
		if err == nil {
			s.OtherUser = other
		}
		// Read watermark of the OTHER member — used for the "Read" badge.
		// (Own last_read_at always tracks own sends, useless for receipts.)
		if t, err := r.getOtherLastReadAt(s.ID, userID); err == nil {
			s.OtherLastReadAt = t
		}
	}

	lastMsg, err := r.getLastMessage(s.ID)
	if err == nil && lastMsg != nil {
		s.LastMessage = lastMsg
	}

	return s, nil
}

// MarkRead updates the last_read_at timestamp for a chat member.
func (r *ChatRepository) MarkRead(chatID, userID int64) error {
	_, err := r.db.Exec(
		`UPDATE chat_members SET last_read_at = NOW() WHERE chat_id = $1 AND user_id = $2`,
		chatID, userID,
	)
	return err
}

// getOtherLastReadAt returns the other member's last_read_at in a 1:1 chat.
func (r *ChatRepository) getOtherLastReadAt(chatID, userID int64) (*time.Time, error) {
	var t time.Time
	err := r.db.QueryRow(
		`SELECT cm.last_read_at FROM chat_members cm
		 WHERE cm.chat_id = $1 AND cm.user_id != $2 LIMIT 1`,
		chatID, userID,
	).Scan(&t)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// getOtherMember returns the other participant in a 1:1 chat.
func (r *ChatRepository) getOtherMember(chatID, excludeUserID int64) (*domain.UserBrief, error) {
	var u domain.UserBrief
	err := r.db.QueryRow(`
		SELECT u.id, u.fullname, u.email
		FROM users u
		JOIN chat_members cm ON cm.user_id = u.id
		WHERE cm.chat_id = $1 AND cm.user_id != $2
		LIMIT 1`, chatID, excludeUserID,
	).Scan(&u.ID, &u.Fullname, &u.Email)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// getLastMessage returns the most recent message in a chat.
func (r *ChatRepository) getLastMessage(chatID int64) (*domain.MessageWithSender, error) {
	var m domain.MessageWithSender
	err := r.db.QueryRow(`
		SELECT m.id, m.chat_id, m.sender_id, u.fullname, m.body, m.created_at
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE m.chat_id = $1
		ORDER BY m.id DESC
		LIMIT 1`, chatID,
	).Scan(&m.ID, &m.ChatID, &m.SenderID, &m.SenderName, &m.Body, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}
