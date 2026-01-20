package main

import (
	"kyc-backend/http/routes"
	"kyc-backend/internal/database"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system env")
	}

	database.Connect()

	router := gin.New()
	router.Use(gin.Recovery())
	routes.Setup(router)


	port := os.Getenv("PORT")
	if port == "" {
		port = "9090"
	}

	log.Println("listening on localhost:", port)
	router.Run(":" + port)
}
