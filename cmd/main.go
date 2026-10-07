package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os/exec"
	"runtime"

	"api-filter-tests/config"
	"api-filter-tests/internal/client"
	"api-filter-tests/internal/handler"
	"api-filter-tests/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Directiva de Go para incrustar el contenido de frontend/dist dentro del ejecutable
var staticFiles embed.FS

func main() {
	cfg := config.LoadConfig()

	sypagoClient := client.NewSypagoClient(cfg)
	builderService := service.NewQueryBuilderService()
	runnerService := service.NewTestRunnerService(sypagoClient)
	filterHandler := handler.NewFilterHandler(builderService, runnerService)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5174", "http://localhost:5173"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	// 1. Rutas de la API Backend
	v1 := r.Group("/api/v1")
	{
		v1.GET("/fields", filterHandler.GetFields)
		v1.POST("/query/execute", filterHandler.ExecuteQuery)
		v1.POST("/test-suites/run", filterHandler.RunTestSuite)
	}

	// 2. Servir los archivos estáticos de React incrustados
	subFS, err := fs.Sub(staticFiles, "frontend/dist")
	if err != nil {
		log.Fatalf("Error al obtener subdirectorio de estáticos: %v", err)
	}

	// Servir el SPA (Single Page Application)
	r.NoRoute(func(c *gin.Context) {
		// Si la petición arranca con /api, dejar que devuelva 404 estándar
		if len(c.Request.URL.Path) >= 4 && c.Request.URL.Path[:4] == "/api" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Endpoint no encontrado"})
			return
		}
		// Para cualquier otra ruta, servir index.html de React
		http.FileServer(http.FS(subFS)).ServeHTTP(c.Writer, c.Request)
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	url := fmt.Sprintf("http://localhost%s", addr)

	log.Printf("Servidor iniciado en %s", url)

	// Opcional: Abrir automáticamente el navegador al ejecutar el .exe
	openBrowser(url)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Error al iniciar el servidor: %v", err)
	}
}

// Función auxiliar para abrir el navegador predeterminado automáticamente
func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	}
	if err != nil {
		log.Printf("No se pudo abrir el navegador automáticamente: %v", err)
	}
}
