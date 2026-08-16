package main

import (
	delivery "backend/internal/delivery/http"
	"backend/internal/delivery/ws"
	"backend/internal/repository"
	"backend/internal/usecase"
	"backend/pkg/database"
	"log"
	"time"
	

	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	dbConfig := database.Config{
		Host:     "127.0.0.1",
		Port:     "5432",
		User:     "postgres",
		Password: "root",
		DBName:   "shit_chat",
		SSLMode:  "disable",
	}

	db, err := database.InitPostgres(dbConfig)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Run embedded migrations (idempotent)
	if err := database.ApplyMigrations(db); err != nil {
		log.Fatal("Failed to apply migrations:", err)
	}

	// Scoped rate limiters
	authRate := limiter.Rate{Period: 10 * time.Second, Limit: 5}
	authStore := memory.NewStore()
	authLimiter := mgin.NewMiddleware(limiter.New(authStore, authRate))

	chatRate := limiter.Rate{Period: 10 * time.Second, Limit: 120}
	chatStore := memory.NewStore()
	chatLimiter := mgin.NewMiddleware(limiter.New(chatStore, chatRate))

	// Repositories
	userRepo := repository.NewUserRepository(db)
	chatRepo := repository.NewChatRepository(db)
	msgRepo := repository.NewMessageRepository(db)

	// Services
	authService := usecase.NewAuthService(userRepo)
	chatService := usecase.NewChatService(chatRepo, msgRepo, userRepo)

	// WebSocket
	hub := ws.NewHub()
	go hub.Run()
	wsHandler := ws.NewHandler(hub, chatService)

	// Controllers
	authCtrl := delivery.NewAuthController(authService)
	userCtrl := delivery.NewUserController(userRepo)
	chatCtrl := delivery.NewChatController(chatService, hub)

	// Map routes
	delivery.MapRoutes(r, authCtrl, userCtrl, chatCtrl, wsHandler, authLimiter, chatLimiter)

	r.Run(":8080")
}
