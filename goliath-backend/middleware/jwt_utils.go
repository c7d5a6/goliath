package middleware

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CreateToken creates a JWT token with user information
func CreateToken(userID int, email string, secretKey string, expirationHours int) (string, error) {
	claims := jwt.MapClaims{
		"user_id": float64(userID), // JWT uses float64 for numbers
		"email":   email,
		"exp":     time.Now().Add(time.Duration(expirationHours) * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secretKey))
}

// CreateTestToken creates a JWT token for testing (24 hour expiration)
func CreateTestToken(userID int, email string, secretKey string) (string, error) {
	return CreateToken(userID, email, secretKey, 24)
}

