package handler

import (
	"net/http"

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

// GetFields godoc
// GET /api/v1/fields
func (h *FilterHandler) GetFields(c *gin.Context) {
	fields := h.builderService.GetAvailableFields()
	c.JSON(http.StatusOK, gin.H{"fields": fields})
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
		c.JSON(http.StatusBadRequest, gin.H{"Error: Json mal formado": err.Error()})
		return
	}

	results, err := h.runnerService.RunSuite(groupFilter, params)
	if err != nil {
		// Aquí respondemos al usuario cuando faltan los argumentos obligatorios o algo esta chimbo del lado de sypago
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
