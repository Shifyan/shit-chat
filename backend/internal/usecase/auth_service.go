package usecase

import (
	"backend/internal/repository"
	"backend/pkg/jwt"
	"errors"
	"fmt"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(repo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: repo}
}

func (s *AuthService) Register(fullname, email, password string) (error) {
	existingUser, _ := s.userRepo.GetUserByEmail(email)
	if existingUser != nil {
		return errors.New("email already exists")
	}
	hashedPassword, err:= bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error hashing password:", err)
		return err
	}
	return s.userRepo.CreateUser(fullname,email,string(hashedPassword))
}

func (s *AuthService) Login(email, password string) (string, error){
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil{
		return "", errors.New(("username or password invalid"))
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil{
		return "", errors.New(("username or password invalid"))
	}

	userIDStr := strconv.FormatInt(user.ID, 10)
	token, err := jwt.GenerateToken(userIDStr)
	if err != nil{
		return "", err
	}
	return token, nil

}