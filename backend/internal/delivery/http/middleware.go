package http

import (
	"backend/pkg/jwt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

const userIDKey = "user_id"

// RequireAuth is a Gin middleware that validates the JWT token cookie.
// On success it injects the user's ID into the Gin context.
// On failure it aborts with 401.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("token")
		if err != nil || token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Authentication required"})
			return
		}

		userIDStr, err := jwt.ValidateToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Invalid or expired token"})
			return
		}

		userID, err := strconv.ParseInt(userIDStr, 10, 64)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "Invalid token payload"})
			return
		}

		c.Set(userIDKey, userID)
		c.Next()
	}
}

// CurrentUserID extracts the authenticated user's ID from the Gin context.
// Returns 0 if not found (should not happen behind RequireAuth).
func CurrentUserID(c *gin.Context) int64 {
	id, exists := c.Get(userIDKey)
	if !exists {
		return 0
	}
	uid, ok := id.(int64)
	if !ok {
		return 0
	}
	return uid
}
