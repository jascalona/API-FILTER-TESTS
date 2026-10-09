package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"api-filter-tests/internal/domain"
	"api-filter-tests/internal/service"

	"github.com/gin-gonic/gin"
)

type FilterHandler struct {
	builderService *service.QueryBuilderService
	runnerService  *service.TestRunnerService
}

func NewFilterHandler(bs *service.QueryBuilderService, rs *service.TestRunnerService) *FilterHandler {
	return &FilterHandler{
		builderService: bs,
		runnerService:  rs,
	}
}

// ExecuteQuery godoc
// POST /api/v1/query/execute
func (h *FilterHandler) ExecuteQuery(c *gin.Context) {
	var req domain.FilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload de filtros inválido"})
		return
	}

	condition := h.builderService.BuildCondition(req)
	result := h.runnerService.ExecuteCustomQuery(condition)

	c.JSON(http.StatusOK, result)
}

// RunTestSuite godoc
// POST /api/v1/test-suites/run?group=all
func (h *FilterHandler) RunTestSuite(c *gin.Context) {
	groupFilter := c.DefaultQuery("group", "all")

	var params service.SuiteParams
	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Json mal formado", "details": err.Error()})
		return
	}

	results, err := h.runnerService.RunSuite(groupFilter, params)
	if err != nil {
		var errorServExternal *domain.MapperError
		if errors.As(err, &errorServExternal) {
			c.JSON(errorServExternal.StatusCode, errorServExternal.Message)
			return
		}

		c.JSON(http.StatusConflict, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total":   len(results),
		"results": results,
	})
}

// Estructura para el árbol de filtros dinámicos
type FilterNode struct {
	Operator string       `json:"operator,omitempty"`
	Children []FilterNode `json:"children,omitempty"`
	Field    string       `json:"field,omitempty"`
	Op       string       `json:"op,omitempty"`
	Value    string       `json:"value,omitempty"`
}

// BuildCondition construye la expresión limpia en formato and(...) / or(...)
func (n *FilterNode) BuildCondition() string {
	if n.Field != "" && n.Op != "" && n.Value != "" {
		return fmt.Sprintf("%s:%s:%s", n.Field, n.Op, n.Value)
	}

	if len(n.Children) == 0 {
		return ""
	}

	var validParts []string
	for _, child := range n.Children {
		part := child.BuildCondition()
		if part != "" {
			validParts = append(validParts, part)
		}
	}

	if len(validParts) == 0 {
		return ""
	}

	logicalOp := strings.ToLower(n.Operator)
	if logicalOp != "or" {
		logicalOp = "and"
	}

	return fmt.Sprintf("%s(%s)", logicalOp, strings.Join(validParts, ","))
}

// CustomFilterHandler godoc
// POST /api/v1/custom-filter
func (h *FilterHandler) CustomFilterHandler(c *gin.Context) {
	var rootNode FilterNode
	if err := c.ShouldBindJSON(&rootNode); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "Error.BadRequest",
			"message": "Estructura JSON del filtro inválida: " + err.Error(),
		})
		return
	}

	// 1. Reconstruir la condición en texto plano
	conditionStr := rootNode.BuildCondition()
	if conditionStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "Error.EmptyFilter",
			"message": "No se han especificado reglas válidas para filtrar",
		})
		return
	}

	baseURL := os.Getenv("SYPAGO_BASE_URL")
	if baseURL == "" {
		baseURL = "https://pruebas.api.sypago.net"
	}
	baseURL = strings.TrimRight(baseURL, "/")

	apiToken := os.Getenv("SYPAGO_AUTH_TOKEN")

	// 3. Construir la URL limpia final esperada por SyPago
	finalURL := fmt.Sprintf("%s/api/v1/transaction/filter?condition=%s", baseURL, conditionStr)

	// Crear la petición HTTP directamente sin recodificar la Query String
	req, err := http.NewRequest("GET", finalURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "Error.Internal",
			"message": "Error al crear la petición HTTP: " + err.Error(),
		})
		return
	}

	// 5. Inyectar Encabezados Estándar de Autenticación
	req.Header.Set("Accept", "application/json")
	if apiToken != "" {
		req.Header.Set("Authorization", "Bearer "+apiToken)
	}

	// 6. Ejecutar la llamada HTTP midiendo latencia
	client := &http.Client{Timeout: 15 * time.Second}
	startTime := time.Now()
	resp, err := client.Do(req)
	latency := time.Since(startTime).Milliseconds()

	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"code":    "Error.UpstreamService",
			"message": "Error de comunicación con el servicio de SyPago: " + err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)

	// 7. Mapear respuesta cruda para la interfaz web / Postman
	var rawJSON json.RawMessage
	if err := json.Unmarshal(respBytes, &rawJSON); err != nil {
		rawJSON = json.RawMessage(fmt.Sprintf(`{"message": %q}`, string(respBytes)))
	}

	c.JSON(resp.StatusCode, gin.H{
		"generated_condition": conditionStr,
		"target_url":          finalURL,
		"status_code":         resp.StatusCode,
		"latency_ms":          latency,
		"raw_response":        rawJSON,
	})
}
