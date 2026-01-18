package kycHandlers

import (
	"fmt"
	"net/http"
	"time"

	"kyc-backend/http/handlers/sseHandlers"
	"kyc-backend/internal/database"
	"kyc-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func SubmitKYCProfile(c *gin.Context) {
	var body struct {
		FullName    string `json:"fullName" binding:"required"`
		Email       string `json:"email" binding:"required,email"`
		Phone       string `json:"phone"`
		DateOfBirth string `json:"dateOfBirth"`
		NationalID  string `json:"nationalID"`
	}


	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// if err := c.ShouldBindJSON(&body); err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
	// 	return
	// }

	var dob *time.Time
	if body.DateOfBirth != "" {
		parsed, err := time.Parse("2006-01-02", body.DateOfBirth)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
			return
		}
		dob = &parsed
	}

	customer := models.Customer{
		FullName:       body.FullName,
		Email:          body.Email,
		Phone:          body.Phone,
		DateOfBirth:    dob,
		NationalID:     body.NationalID,
		KYCStatus:      "profile_submitted",
	}

	if err := database.DB.Create(&customer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "KYC profile submitted",
		"customer_id": customer.ID,
	})

}


func ScheduleKYCMeeting(c *gin.Context) {
	var body struct {
		CustomerID  uint   `json:"customer_id" binding:"required"`
		ScheduledAt string `json:"scheduled_at" binding:"required"` // RFC3339
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	scheduledTime, err := time.Parse(time.RFC3339, body.ScheduledAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid datetime format"})
		return
	}

	// Verify customer exists
	var customer models.Customer
	if err := database.DB.Select("id").Where("id = ?", body.CustomerID).First(&customer).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
		return
	}

	meetingID := "kyc_" + fmt.Sprintf("%d", time.Now().UnixNano())

	session := models.KYCSession{
		CustomerID:  customer.ID,
		MeetingID:   meetingID,
		ScheduledAt: scheduledTime,
		Status:      "scheduled",
	}

	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to schedule"})
		return
	}

	// Update customer status
	database.DB.Model(&customer).Update("kyc_status", "scheduled")

	// In real app: send email/SMS with link

	meetingLink := fmt.Sprintf("https://test-kyc-app.duckdns.org//kyc/%s", meetingID)

	c.JSON(http.StatusOK, gin.H{
		"message":      "Meeting scheduled",
		"meeting_link": meetingLink,
		"meeting_id":   meetingID,
	})
}

func GetKYCMeeting(c *gin.Context) {
	meetingID := c.Param("meetingId")

	var session models.KYCSession
	if err := database.DB.
		Where("meeting_id = ?", meetingID).
		Preload("Customer").
		First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}

	if session.Status != "scheduled" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Meeting not available"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"meeting_id":   session.MeetingID,
		"national_id":  session.Customer.NationalID, // ← expose for verification
		"scheduled_at": session.ScheduledAt,
		"customer": gin.H{
			"name":  session.Customer.FullName,
			"email": session.Customer.Email,
		},
		"status": session.Status,
	})
}

func NotifyAdmin(c *gin.Context) {
	var body struct {
		MeetingID string `json:"meeting_id"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Fetch customer's national ID
	var session models.KYCSession
	if err := database.DB.
		Where("meeting_id = ?", body.MeetingID).
		Preload("Customer").
		First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}

	// Notify all connected admins
	sseHandlers.NotifyAdmins(body.MeetingID, session.Customer.NationalID)

	c.JSON(http.StatusOK, gin.H{"message": "Admin notified"})
}

func StartKYCSession(c *gin.Context) {
	meetingID := c.Param("meetingId")

	var session models.KYCSession
	if err := database.DB.
		Where("meeting_id = ?", meetingID).
		First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Meeting not found"})
		return
	}

	// Optional: verify user is agent (via JWT)
	// userID := c.MustGet("user_id").(uint)
	// TODO: check if user is agent

	// Update status
	session.Status = "ongoing"
	database.DB.Save(&session)

	c.JSON(http.StatusOK, gin.H{"message": "Meeting started"})
}