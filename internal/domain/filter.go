package domain

import "encoding/json"

// Rule representa un filtro individual enviado desde el Query Builder en React
type Rule struct {
	Field    string `json:"field"`    // ej: "transaction_id", "status", "amount"
	Operator string `json:"operator"` // ej: "eq", "like", "lte", "gte", "btwn"
	Value    string `json:"value"`    // ej: "A60427ED515C" o "10|100"
}

// FilterRequest representa el payload completo de filtros enviado desde el Front
type FilterRequest struct {
	LogicalOperator string `json:"logical_operator"` // "and"
	Rules           []Rule `json:"rules"`
}

// QueryExecutionResponse devuelve la metadata y el JSON crudo sin deserializar
type QueryExecutionResponse struct {
	ConditionGenerated string          `json:"condition_generated"`
	StatusCode         int             `json:"status_code"`
	LatencyMs          int64           `json:"latency_ms"`
	RawResponse        json.RawMessage `json:"raw_response"` // JSON sin mapear, tal cual responde SyPago
}

// TestResult representa el resultado individual de la ejecución de un Test Case
type TestResult struct {
	ID           string          `json:"id"`
	TestCaseName string          `json:"test_case_name"`
	Group        string          `json:"group"`
	Condition    string          `json:"condition"`
	StatusCode   int             `json:"status_code"`
	ExpectedCode int             `json:"expected_code"`
	LatencyMs    int64           `json:"latency_ms"`
	Passed       bool            `json:"passed"`
	Error        string          `json:"error,omitempty"`
	RawResponse  json.RawMessage `json:"raw_response,omitempty"` // Para inspección visual en caso de fallos
}
