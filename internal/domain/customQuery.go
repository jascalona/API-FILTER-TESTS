package domain

import (
	"fmt"
	"strings"
)

// Struct recursivo para recibir el JSON
type FilterNode struct {
	Operator string       `json:"operator,omitempty"` // "and" o "or"
	Rules    []FilterNode `json:"rules,omitempty"`    // Subgrupos o reglas hijas
	Field    string       `json:"field,omitempty"`    // "status", "amount", etc.
	Op       string       `json:"operator,omitempty"` // "eq", "like", "btwn", etc.
	Value    string       `json:"value,omitempty"`    // "ACCP", "10|100", etc.
}

// BuildCondition traduce el árbol JSON a la sintaxis del api-filter
func (n *FilterNode) BuildCondition() string {
	// Caso A: Es una regla simple (hoja)
	if n.Field != "" && n.Op != "" && n.Value != "" {
		return fmt.Sprintf("%s:%s:%s", n.Field, n.Op, n.Value)
	}

	// Caso B: Es un grupo (AND / OR)
	if len(n.Rules) == 0 {
		return ""
	}

	var parts []string
	for _, rule := range n.Rules {
		cond := rule.BuildCondition()
		if cond != "" {
			parts = append(parts, cond)
		}
	}

	if len(parts) == 0 {
		return ""
	}
	if len(parts) == 1 {
		return parts[0]
	}

	op := strings.ToLower(n.Operator)
	if op == "" {
		op = "and"
	}

	return fmt.Sprintf("%s(%s)", op, strings.Join(parts, ","))
}
