package http

import (
	"backend/internal/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
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
