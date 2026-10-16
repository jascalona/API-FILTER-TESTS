package main

import (
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"api-filter-tests/config"
	"api-filter-tests/internal/client"
	"api-filter-tests/internal/handler"
	"api-filter-tests/internal/service"
	"api-filter-tests/internal/static"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	sypagoClient := client.NewSypagoClient(cfg)
	builderService := service.NewQueryBuilderService()
	runnerService := service.NewTestRunnerService(sypagoClient)
	filterHandler := handler.NewFilterHandler(builderService, runnerService)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// 1. Rutas de la API Backend
	v1 := r.Group("/api/v1")
	{
		v1.POST("/custom-filter", filterHandler.CustomFilterHandler)
		v1.POST("/query/execute", filterHandler.ExecuteQuery)
		v1.POST("/test-suites/run", filterHandler.RunTestSuite)
	}

	// 2. Extraer subdirectorio de estáticos del paquete internal/static
	subFS, err := fs.Sub(static.Files, "dist")
	if err != nil {
		log.Fatalf("Error al obtener subdirectorio de estáticos: %v", err)
	}

	// Servir el Single Page Application (React)
	r.NoRoute(func(c *gin.Context) {
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint no encontrado"})
			return
		}
		http.FileServer(http.FS(subFS)).ServeHTTP(c.Writer, c.Request)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	url := fmt.Sprintf("http://localhost%s", addr)

	fmt.Println("====================================================")
	log.Printf("Servidor iniciado exitosamente en: %s", url)
	fmt.Println("Abre tu navegador e ingresa a la dirección mostrada arriba.")
	fmt.Println("====================================================")

	if err := r.Run(addr); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}
