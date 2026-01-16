// internal/models/kyc_session.go
package models

import "time"

type KYCSession struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	CustomerID uint      `gorm:"not null" json:"customer_id"`
	Customer   Customer  `gorm:"foreignKey:CustomerID;constraint:OnDelete:CASCADE" json:"-"`

	MeetingID   string    `gorm:"uniqueIndex;not null" json:"meeting_id"` // e.g., "kyc_abc123"
	ScheduledAt time.Time `json:"scheduled_at"`
	Status      string    `gorm:"default:'scheduled'" json:"status"` // scheduled, ongoing, completed, cancelled

	AgentID *uint `json:"agent_id,omitempty"` // references User.ID (staff)

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}