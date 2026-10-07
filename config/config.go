package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	SypagoBaseURL string
	SypagoToken   string
}

func LoadConfig() *Config {
	// Asegurar que el .env persista en la raiz del proyecto
	if err := godotenv.Load(); err != nil {
		log.Println("Info: No se encontró archivo .env, usando variables del sistema")
	}

	return &Config{
		Port:          getEnv("PORT", "8085"),
		SypagoBaseURL: getEnv("SYPAGO_BASE_URL", "https://pruebas.api.sypago.net"),
		SypagoToken:   getEnv("SYPAGO_AUTH_TOKEN", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
