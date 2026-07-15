package main

import (
	"backend/internal/delivery/http"
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
r.Use(func(c *gin.Context) {
    c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // URL Frontend Anda
    c.Writer.Header().Set("Access-Control-Allow-Credentials", "true") // Wajib true untuk cookie
    c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
    c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

    // JIKA REQUEST ADALAH OPTIONS, LANGSUNG PUTUS DAN KEMBALIKAN 204
    if c.Request.Method == "OPTIONS" {
        c.AbortWithStatus(204)
        return
    }

    c.Next()
})
dbConfig := database.Config{
	Host: "127.0.0.1",
	Port: "5432",
	User: "postgres",
	Password: "root",
	DBName: "shit_chat",
	SSLMode: "disable",
}

db, err := database.InitPostgres(dbConfig)
if err != nil {
	log.Fatal("Failed to connect to database:", err)
}
defer db.Close()

rate := limiter.Rate{Period: 10*time.Second, Limit: 5}
store := memory.NewStore()
middleware:= mgin.NewMiddleware(limiter.New(store,rate))
r.Use(middleware)
userRepo := repository.NewUserRepository(db)
authService := usecase.NewAuthService(userRepo)
authCtrl := http.NewAuthController(authService)



http.MapRoutes(r, authCtrl)

r.Run(":8080")
}