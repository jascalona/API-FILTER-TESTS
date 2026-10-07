package service

import (
	"api-filter-tests/internal/domain"
	"fmt"
	"strings"
)

type QueryBuilderService struct{}

func NewQueryBuilderService() *QueryBuilderService {
	return &QueryBuilderService{}
}

// BuilderCondition transforma el struct FilterRequest en el string que espera sypago
// Ejmplo de salida: "and(status:eq:ACCP,amount:btwn:10|100)"

func (s *QueryBuilderService) BuildCondition(req domain.FilterRequest) string {
	if len(req.Rules) == 0 {
		return ""
	}

	logicalOp := strings.ToLower(strings.TrimSpace(req.LogicalOperator))
	if logicalOp == "" {
		logicalOp = "and"
	}

	var clauses []string
	for _, rule := range req.Rules {
		field := strings.TrimSpace(rule.Field)
		op := strings.ToLower(strings.TrimSpace(rule.Operator))
		val := strings.TrimSpace(rule.Value)

		if field != "" && op != "" && val != "" {
			clauses = append(clauses, fmt.Sprintf("%s:%s:%s", field, op, val))
		}
	}

	if len(clauses) == 0 {
		return ""
	}

	return fmt.Sprintf("%s(%s)", logicalOp, strings.Join(clauses, ","))

}

// GetAvailableFields retorna el esquema de campos para poblar los sectores de react
func (s *QueryBuilderService) GetAvailableFields() []domain.FieldSchema {
	return []domain.FieldSchema{
		{
			Field:     "transaction_id",
			Label:     "ID Transacción",
			Type:      "string",
			Operators: []string{"eq", "like"},
		},
		{
			Field:     "ref_ibp",
			Label:     "Referencia IBP",
			Type:      "string",
			Operators: []string{"eq", "like"},
		},

		{
			Field:     "operationSecret",
			Label:     "UUID Sypago",
			Type:      "string",
			Operators: []string{"eq", "like"},
		},

		{
			Field:     "status",
			Label:     "Estatus",
			Type:      "string",
			Operators: []string{"eq", "ne"},
		},
		{
			Field:     "amt",
			Label:     "Monto",
			Type:      "number",
			Operators: []string{"eq", "gte", "lte", "btwn"},
		},
		{
			Field:     "InitTransactionDate",
			Label:     "Fecha de Inicio de operacion",
			Type:      "string",
			Operators: []string{"eq", "btwn"},
		},
		{
			Field:     "operation_date",
			Label:     "Fecha final de operacion",
			Type:      "string",
			Operators: []string{"eq", "btwn"},
		},
		{
			Field:     "user_id",
			Label:     "Usuario (Master)",
			Type:      "string",
			Operators: []string{"eq", "like"},
		},
		{
			Field:     "subuser_id",
			Label:     "Subusuario",
			Type:      "string",
			Operators: []string{"eq", "like"},
		},
	}
}
