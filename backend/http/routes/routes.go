package routes

import (
	"kyc-backend/http/handlers/authHandlers"
	"kyc-backend/http/handlers/kycHandlers"
	"kyc-backend/http/handlers/sseHandlers"
	"kyc-backend/http/handlers/wsHandlers"
	"kyc-backend/http/middleware"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)
func Setup(router *gin.Engine) {
    // Put CORS as early as possible
    router.Use(cors.New(cors.Config{
        AllowOrigins: []string{
            "http://localhost:5173",          // Vite dev
            "https://test-kyc-app.duckdns.org",      // prod
        },
        // AllowOriginFunc: func(origin string) bool {
        //     return true // ← still ok for dev
        //     // Later: return origin == "http://localhost:3000" || origin == "https://your-frontend.com"
        // },
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "Origin", "X-Requested-With"},
        ExposeHeaders:    []string{"Content-Length", "Content-Type"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))

	router.GET("/api/sse", sseHandlers.SSEHandler) // ← add this

    // WebSocket - no cors needed usually
    router.GET("/ws", wsHandlers.WebSocketHandler)

    api := router.Group("/api")
    {
        // Public routes
        api.POST("/kyc/submit", kycHandlers.SubmitKYCProfile)
        api.POST("/kyc/schedule", kycHandlers.ScheduleKYCMeeting)
		api.POST("/kyc/notify-admin", kycHandlers.NotifyAdmin) // ← add this
        api.GET("/kyc/meeting/:meetingId", kycHandlers.GetKYCMeeting)
        api.POST("/register", authHandlers.Register)
        api.POST("/login", authHandlers.Login)
        api.POST("/logout", authHandlers.Logout)

        protected := api.Group("/")
        protected.Use(middleware.AuthMiddleware())
        protected.GET("/profile", authHandlers.Profile)
		protected.POST("/kyc/session/:meetingId/start", kycHandlers.StartKYCSession)
    }
}