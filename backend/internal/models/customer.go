package models

import (
	"time"
)

type Customer struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"` // optional contact, but NOT for login
	Phone     string    `json:"phone,omitempty"`

	DateOfBirth    *time.Time `json:"date_of_birth,omitempty"`
	NationalID     string     `json:"national_id,omitempty"`
	IDDocumentURL  string     `json:"id_document_url,omitempty"`
	SelfieURL      string     `json:"selfie_url,omitempty"`

	KYCStatus string `gorm:"default:'profile_submitted'" json:"kyc_status"` // profile_submitted, scheduled, verified, rejected

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}