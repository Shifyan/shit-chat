package http

import (
	"backend/internal/usecase"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthRequest struct{
	Fullname string `json:"fullname" binding:"required,min=3"`
	Email string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct{
	Email string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type AuthController struct{
	authService *usecase.AuthService
}

func NewAuthController(s *usecase.AuthService) *AuthController{
	return &AuthController{authService: s}
}

func (ctrl *AuthController) Register(c *gin.Context){
	var req AuthRequest
	if err:= c.ShouldBindJSON(&req); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{"error":"Invalid Input"})
		return
	}
	err := ctrl.authService.Register(req.Fullname, req.Email, req.Password)
	if err != nil{
		c.JSON(http.StatusInternalServerError, gin.H{"error":err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message":"User registered successfully"})
}

func (ctrl *AuthController) Login(c *gin.Context) {
    var req LoginRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        // PERBAIKAN: Kembalikan err.Error() agar Anda bisa melihat penyebab aslinya di response
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    fmt.Println("Email:", req.Email)
    fmt.Println("Password:", req.Password)
    
    token, err := ctrl.authService.Login(req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Credentials"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"token": token})
}