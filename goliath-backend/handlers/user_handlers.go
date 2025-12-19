package handlers

import (
	"goliath/services"

	"github.com/gin-gonic/gin"
)

// UserHandlers handles HTTP requests for user-related endpoints
type UserHandlers struct {
	userService *services.UserService
}

// NewUserHandlers creates a new UserHandlers
func NewUserHandlers(userService *services.UserService) *UserHandlers {
	return &UserHandlers{
		userService: userService,
	}
}

// GetUsers handles GET /users
func (h *UserHandlers) GetUsers(c *gin.Context) {
	ctx := c.Request.Context()

	users, err := h.userService.GetAllUsers(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"users": users,
		"count": len(users),
	})
}

