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
