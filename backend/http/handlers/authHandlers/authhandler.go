package authHandlers

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"kyc-backend/internal/database"
	"kyc-backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"github.com/golang-jwt/jwt/v5"
)

func Register(c *gin.Context) {
	var body struct {
		Email    string
		Password string
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 10)

	user := models.User{
		Email:    body.Email,
		Password: string(hash),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already exists"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registered successfully"})
}

func Login(c *gin.Context) {
	var body struct {
		Email    string
		Password string
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", body.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, _ := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	// Set HTTP-only cookie
	c.SetCookie(
		"auth_token",      // cookie name
		tokenString,       // value
		3600*24,           // expires in seconds (1 day)
		"/",               // path
		"",                // domain (default)
		false,             // secure (set true if HTTPS)
		true,              // httpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged in successfully",
	})
}

func Logout(c *gin.Context) {
	c.SetCookie(
		"auth_token",
		"",
		-1, // expire immediately
		"/",
		"",
		false,
		true,
	)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}



func Profile(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	c.JSON(http.StatusOK, gin.H{"user_id": userID, "message": "You are logged in!"})
}
