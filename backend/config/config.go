package config

import (
	"log"
	"os"
)

var DB_FILE string
var ENV string

func init() {
	ENV = os.Getenv("ENVIRONMENT")
	if(ENV == "") {
		log.Println("ENVIRONMENT not found, set to dev")
		ENV = "dev"
	}

	DB_FILE = os.Getenv("DATABASE_FILE")
	if DB_FILE == "" {
		log.Println("DATABASE_FILE not found, set to default")
		DB_FILE = "goauth.db"
	}

}