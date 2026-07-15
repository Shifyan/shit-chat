package http

import (
	"backend/internal/usecase"
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
		if len(req.Fullname) < 3 {
			c.JSON(http.StatusBadRequest, gin.H{"message":"Fullname must be at least 3 characters long"})
			return	
		}
		if len(req.Password) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"message":"Password must be at least 8 characters long"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message":"Invalid Input"})
		return
	}
	token, err := ctrl.authService.Register(req.Fullname, req.Email, req.Password)
	if err != nil{
		c.JSON(http.StatusConflict, gin.H{"message":err.Error()})
		return
	}
	c.SetCookie(
		"token", token,
		3600*24*7,
		"/",
		"localhost",
		false,
		true,
	)
	c.JSON(http.StatusOK, gin.H{"message":"User registered successfully"})
}

func (ctrl *AuthController) Login(c *gin.Context) {
    var req LoginRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        // PERBAIKAN: Kembalikan err.Error() agar Anda bisa melihat penyebab aslinya di response
		if len(req.Password) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Password must be at least 8 characters long"})
			return
		}
        c.JSON(http.StatusBadRequest, gin.H{"message": "Failed to Login"})
        return
    }
    
    token, err := ctrl.authService.Login(req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
        return
    }
	c.SetCookie(
		"token", token,
		3600*24*7,
		"/",
		"localhost",
		false,
		true,
	)
    c.JSON(http.StatusOK, gin.H{"message":"User logged in successfully"})
}

func (ctrl *AuthController) Logout(c *gin.Context){
	c.SetCookie(
		"token", "",
		-1,
		"/",
		"localhost",
		false,
		true,
	)
	c.JSON(http.StatusOK, gin.H{"message":"Logout"})
}