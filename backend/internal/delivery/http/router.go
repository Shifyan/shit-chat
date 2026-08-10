package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// WsHandler is the interface the WebSocket handler must satisfy.
type WsHandler interface {
	ServeWS(c *gin.Context)
}

func MapRoutes(
	r *gin.Engine,
	authCtrl *AuthController,
	userCtrl *UserController,
	chatCtrl *ChatController,
	wsHandler WsHandler,
	authLimiter gin.HandlerFunc,
	chatLimiter gin.HandlerFunc,
) {
	// Public auth routes — strict rate limit (5 req / 10s)
	auth := r.Group("/api/v1")
	auth.Use(authLimiter)
	{
		auth.POST("/register", authCtrl.Register)
		auth.POST("/login", authCtrl.Login)
		auth.POST("/logout", authCtrl.Logout)
	}

	// Protected routes — require auth + lenient rate limit (120 req / 10s)
	api := r.Group("/api/v1")
	api.Use(RequireAuth())
	api.Use(chatLimiter)
	{
		api.GET("/me", userCtrl.Me)
		api.GET("/users", userCtrl.SearchUsers)
		api.GET("/chats", chatCtrl.ListChats)
		api.POST("/chats", chatCtrl.CreateChat)
		api.GET("/chats/:id/messages", chatCtrl.GetMessages)
		api.POST("/chats/:id/read", chatCtrl.MarkRead)
		api.GET("/ws", func(c *gin.Context) {
			wsHandler.ServeWS(c)
		})
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
}
