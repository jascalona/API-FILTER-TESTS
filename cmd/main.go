package main

import (
	"fmt"
	"log"
	"net/http"

	"api-filter-tests/config"
	"api-filter-tests/internal/client"
	"api-filter-tests/internal/handler"
	"api-filter-tests/internal/service"

	"github.com/gin-gonic/gin"
)

// Middleware CORS básico para permitir peticiones desde el frontend (React)
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func main() {
	// 1. Cargar configuración desde .env o variables de entorno
	cfg := config.LoadConfig()

	// 2. Inicializar cliente HTTP de SyPago
	sypagoClient := client.NewSypagoClient(cfg)

	// 3. Inicializar Servicios
	builderService := service.NewQueryBuilderService()
	runnerService := service.NewTestRunnerService(sypagoClient)

	// 4. Inicializar Handler
	filterHandler := handler.NewFilterHandler(builderService, runnerService)

	// 5. Configurar Gin Router
	r := gin.Default()
	r.Use(corsMiddleware())

	// Healthcheck
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Agrupación de rutas API v1
	v1 := r.Group("/api/v1")
	{
		v1.GET("/fields", filterHandler.GetFields)
		v1.POST("/query/execute", filterHandler.ExecuteQuery)
		v1.POST("/test-suites/run", filterHandler.RunTestSuite)
	}

	// 6. Iniciar Servidor
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf(" Servidor iniciado exitosamente en http://localhost%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
