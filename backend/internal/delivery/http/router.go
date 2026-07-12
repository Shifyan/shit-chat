package http

import (
	"github.com/gin-gonic/gin"
)

func MapRoutes(r *gin.Engine, authCtrl *AuthController) {
	
	api := r.Group("/api/v1")
	{
		api.POST("/register", authCtrl.Register)
		api.POST("/login", authCtrl.Login)
	}
}