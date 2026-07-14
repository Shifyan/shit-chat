package usecase

import (
	"backend/internal/repository"
	"backend/pkg/jwt"
	"database/sql" // Tambahkan ini untuk mengecek error sql
	"errors"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(repo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: repo}
}

func (s *AuthService) Register(fullname, email, password string) (string, error) {
	// 1. Perbaiki penanganan error di sini
	existingUser, err := s.userRepo.GetUserByEmail(email)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		// Jika error bukan karena data kosong (misal: db putus), kembalikan error internal
		return "", err 
	}
	
	// Jika user ditemukan (tidak nil), berarti email sudah terdaftar
	if existingUser != nil {
		return "", errors.New("Email Already Exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	newUserID, err := s.userRepo.CreateUser(fullname, email, string(hashedPassword))
	if err != nil {
		return "", err
	}

	userIDStr := strconv.FormatInt(newUserID, 10)
	token, err := jwt.GenerateToken(userIDStr)
	if err != nil {
		return "", err
	}
	return token, nil
}

func (s *AuthService) Login(email, password string) (string, error) {
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil {
		// Menggunakan pesan generik sudah sangat tepat untuk keamanan
		return "", errors.New("Invalid Username or Password") 
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("Invalid Username or Password")
	}

	userIDStr := strconv.FormatInt(user.ID, 10)
	token, err := jwt.GenerateToken(userIDStr)
	if err != nil {
		return "", err
	}
	return token, nil
}
