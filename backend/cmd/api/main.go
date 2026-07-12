package main

import (
	"backend/internal/delivery/http"
	"backend/internal/repository"
	"backend/internal/usecase"
	"backend/pkg/database"
	"log"

	"github.com/gin-gonic/gin"
)



func main() {
r := gin.Default()
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

userRepo := repository.NewUserRepository(db)
authService := usecase.NewAuthService(userRepo)
authCtrl := http.NewAuthController(authService)

http.MapRoutes(r, authCtrl)

r.Run(":8080")
}