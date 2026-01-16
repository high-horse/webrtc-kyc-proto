package database

import (
	"kyc-backend/config"
	"kyc-backend/internal/models"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.DB_FILE), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := migrateModels(); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database connected and migrated!")
}


func migrateModels() error {
	return DB.AutoMigrate(
		&models.User{},
		&models.KYCSession{},
		&models.Customer{},
	)
}