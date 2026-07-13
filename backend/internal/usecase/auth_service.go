package usecase

import (
	"backend/internal/repository"
	"backend/pkg/jwt"
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
	existingUser, _ := s.userRepo.GetUserByEmail(email)
	if existingUser != nil {
		return "", errors.New("email already exists")
	}
	hashedPassword, err:= bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	newUserID, err := s.userRepo.CreateUser(fullname,email,string(hashedPassword))
	if err != nil{
		return "", err
	}

	userIDStr:=strconv.FormatInt(newUserID, 10)
	token, err := jwt.GenerateToken(userIDStr)
	if err != nil{
		return "", err
	}
	return token, nil
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