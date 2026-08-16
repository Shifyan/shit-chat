package http

import (
	"backend/internal/repository"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct {
	userRepo *repository.UserRepository
}

func NewUserController(repo *repository.UserRepository) *UserController {
	return &UserController{userRepo: repo}
}

// Me returns the currently authenticated user's profile.
func (ctrl *UserController) Me(c *gin.Context) {
	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	user, err := ctrl.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"fullname": user.Fullname,
		"email":    user.Email,
	})
}

type UpdateProfileRequest struct {
	Fullname *string `json:"fullname"`
	Email    *string `json:"email"`
}

// UpdateMe updates the current user's fullname and/or email.
func (ctrl *UserController) UpdateMe(c *gin.Context) {
	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.Fullname == nil && req.Email == nil) {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Provide fullname and/or email to update"})
		return
	}
	if req.Fullname != nil && len(strings.TrimSpace(*req.Fullname)) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Fullname must be at least 3 characters long"})
		return
	}
	if req.Email != nil && !strings.Contains(*req.Email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid email format"})
		return
	}

	user, err := ctrl.userRepo.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	fullname := user.Fullname
	email := user.Email
	if req.Fullname != nil {
		fullname = strings.TrimSpace(*req.Fullname)
	}
	if req.Email != nil {
		email = strings.TrimSpace(*req.Email)
		// Email must not be taken by another account
		existing, err := ctrl.userRepo.GetUserByEmail(email)
		if err == nil && existing.ID != userID {
			c.JSON(http.StatusConflict, gin.H{"message": "Email Already Exists"})
			return
		}
	}

	if err := ctrl.userRepo.UpdateProfile(userID, fullname, email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       userID,
		"fullname": fullname,
		"email":    email,
	})
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// ChangePassword verifies the current password and sets a new one.
func (ctrl *UserController) ChangePassword(c *gin.Context) {

	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		if len(req.NewPassword) < 8 {
			c.JSON(http.StatusBadRequest, gin.H{"message": "New password must be at least 8 characters long"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid input"})
		return
	}

	hash, err := ctrl.userRepo.GetUserPassword(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Current password is incorrect"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to hash password"})
		return
	}
	if err := ctrl.userRepo.UpdatePassword(userID, string(hashed)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to change password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// SearchUsers searches users by name or email prefix.
// Query param: ?q= (minimum 2 characters, case-insensitive)
func (ctrl *UserController) SearchUsers(c *gin.Context) {
	userID := CurrentUserID(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
		return
	}

	q := c.Query("q")
	if len(q) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Query must be at least 2 characters"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 50 {
		limit = 10
	}

	users, err := ctrl.userRepo.SearchUsers(q, userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to search users"})
		return
	}

	if users == nil {
		users = []repository.UserBrief{}
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}
