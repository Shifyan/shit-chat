package usecase

import (
	"backend/internal/domain"
	"backend/internal/repository"
	"errors"
)

type ChatService struct {
	chatRepo    *repository.ChatRepository
	msgRepo     *repository.MessageRepository
	userRepo    *repository.UserRepository
}

func NewChatService(
	chatRepo *repository.ChatRepository,
	msgRepo *repository.MessageRepository,
	userRepo *repository.UserRepository,
) *ChatService {
	return &ChatService{
		chatRepo: chatRepo,
		msgRepo:  msgRepo,
		userRepo: userRepo,
	}
}

// CreateDirectChat creates or gets an existing 1:1 chat between the current user and target.
func (s *ChatService) CreateDirectChat(userID, targetID int64) (*domain.Chat, error) {
	if userID == targetID {
		return nil, errors.New("cannot chat with yourself")
	}

	// Verify target exists
	_, err := s.userRepo.GetUserByID(targetID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return s.chatRepo.GetOrCreateDirectChat(userID, targetID)
}

// GetChats returns all chats for a user with enriched metadata.
func (s *ChatService) GetChats(userID int64) ([]domain.ChatSummary, error) {
	return s.chatRepo.ListChatsForUser(userID)
}

// GetChatSummary returns a single enriched chat summary (for chat_created events).
func (s *ChatService) GetChatSummary(chatID, userID int64) (*domain.ChatSummary, error) {
	return s.chatRepo.GetChatSummary(chatID, userID)
}

// SendMessage validates membership and persists a message.
func (s *ChatService) SendMessage(chatID, senderID int64, body string) (*domain.MessageWithSender, error) {
	if len(body) == 0 || len(body) > 4000 {
		return nil, errors.New("message body must be between 1 and 4000 characters")
	}

	isMember, err := s.chatRepo.IsMember(chatID, senderID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("you are not a member of this chat")
	}

	msg, err := s.msgRepo.CreateMessage(chatID, senderID, body)
	if err != nil {
		return nil, err
	}

	// Update last_read_at for the sender
	_ = s.chatRepo.MarkRead(chatID, senderID)

	return msg, nil
}

// GetMessages returns paginated message history.
func (s *ChatService) GetMessages(chatID, userID int64, beforeID *int64, limit int) (*domain.MessagesResponse, error) {
	isMember, err := s.chatRepo.IsMember(chatID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, errors.New("you are not a member of this chat")
	}

	if limit < 1 || limit > 100 {
		limit = 50
	}

	return s.msgRepo.ListMessages(chatID, beforeID, limit)
}

// MarkRead marks a chat as read up to now for the given user.
func (s *ChatService) MarkRead(chatID, userID int64) error {
	isMember, err := s.chatRepo.IsMember(chatID, userID)
	if err != nil {
		return err
	}
	if !isMember {
		return errors.New("you are not a member of this chat")
	}
	return s.chatRepo.MarkRead(chatID, userID)
}

// GetMembers returns all member IDs in a chat.
func (s *ChatService) GetMembers(chatID int64) ([]int64, error) {
	return s.chatRepo.GetMembers(chatID)
}

// IsMember checks if a user belongs to a chat.
func (s *ChatService) IsMember(chatID, userID int64) (bool, error) {
	return s.chatRepo.IsMember(chatID, userID)
}

// GetMessageByID returns a single message.
func (s *ChatService) GetMessageByID(msgID int64) (*domain.MessageWithSender, error) {
	return s.msgRepo.GetMessageByID(msgID)
}
