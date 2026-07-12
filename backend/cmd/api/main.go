package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

type bodyRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func main() {
	router := gin.Default()
	router.GET("/", func(c *gin.Context) {
		if c.Request.Method == http.MethodGet {
			c.String(http.StatusOK, "Hello World")
		} else {
			c.String(http.StatusMethodNotAllowed, "Method not allowed")
		}
	})
	router.POST("/", func(c *gin.Context) {
		var body bodyRequest
		if err := c.BindJSON(&body); err != nil {
			c.String(http.StatusBadRequest, "Invalid request bodyiii")
			return
		}
		c.String(http.StatusOK, body.Username + " " + body.Password)
	})
	router.Run()
}