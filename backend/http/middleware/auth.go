package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		// Get token from cookie
		tokenString, err := c.Cookie("auth_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No auth token"})
			c.Abort()
			return
		}

		// Parse JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		userID := uint(claims["user_id"].(float64))
		c.Set("user_id", userID)
		c.Next()
	}
}

// func ValidateUserFromRequest(r *http.Request) (*models.User, error) {
// 	cookie, err := r.Cookie("token")
// 	if err != nil {
// 		return nil, err
// 	}

// 	userID, err := verifyJWT(cookie.Value)
// 	if err != nil {
// 		return nil, err
// 	}

// 	var user models.User
// 	database.DB.First(&user, userID)
// 	return &user, nil
// }
