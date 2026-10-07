package service

import (
	"encoding/json"
	"fmt"
	"net/http"

	"api-filter-tests/internal/client"
	"api-filter-tests/internal/domain"
)

type TestCaseDefinition struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	Group        string `json:"group"`
	Condition    string `json:"condition"`
	ExpectedCode int    `json:"expected_code"`
}

// SuiteParams define los parámetros obligatorios que React debe enviar para ejecutar la suite
type SuiteParams struct {
	TransactionID string `json:"transaction_id"`
	TxLike        string `json:"tx_like"`
	Status        string `json:"status"`
	RejectedCode  string `json:"rejected_code"`
	RjCodeLike    string `json:"rj_code_like"`
	RefIBP        string `json:"ref_ibp"`
	RefIBPLike    string `json:"ref_ibp_like"`
	Amount        string `json:"amount"`
	AmountLike    string `json:"amount_like"`
	AmountLTE     string `json:"amount_lte"`
	AmountGTE     string `json:"amount_gte"`
	AmountBtwn    string `json:"amount_btwn"`
}

// ValidateParams verifica que todos los campos requeridos estén presentes
func (p *SuiteParams) ValidateParams() error {
	if p.TransactionID == "" || p.TxLike == "" || p.Status == "" ||
		p.RejectedCode == "" || p.RjCodeLike == "" || p.RefIBP == "" ||
		p.RefIBPLike == "" || p.Amount == "" || p.AmountLike == "" ||
		p.AmountLTE == "" || p.AmountGTE == "" || p.AmountBtwn == "" {
		return fmt.Errorf("faltan argumentos obligatorios para aplicar los filtros de la suite de pruebas")
	}
	return nil
}

type TestRunnerService struct {
	sypagoClient *client.SypagoClient
}

func NewTestRunnerService(sc *client.SypagoClient) *TestRunnerService {
	return &TestRunnerService{sypagoClient: sc}
}

// GetTestCases construye el catálogo de pruebas usando los parámetros dinámicos proporcionados
func (s *TestRunnerService) GetTestCases(params SuiteParams) []TestCaseDefinition {
	return []TestCaseDefinition{
		//---- Test Case argument: transaction_id ----//
		{
			ID:           "TX-01",
			Name:         "transaction_id - EQ",
			Group:        "transaction_id",
			Condition:    fmt.Sprintf("and(transaction_id:eq:%s)", params.TransactionID),
			ExpectedCode: http.StatusOK,
		},
		{
			ID:           "TX-02",
			Name:         "transaction_id - LIKE",
			Group:        "transaction_id",
			Condition:    fmt.Sprintf("and(transaction_id:like:%s)", params.TxLike),
			ExpectedCode: http.StatusOK,
		},

		//---- Test Case argument: status (ACCP/RJCT) ----//
		{
			ID:           "ST-01",
			Name:         "status - EQ",
			Group:        "status",
			Condition:    fmt.Sprintf("and(status:eq:%s)", params.Status),
			ExpectedCode: http.StatusOK,
		},

		//---- Test Case argument: rejected_code ----//
		{
			ID:           "ST-C-01",
			Name:         "rejected_code - EQ",
			Group:        "rejected_code",
			Condition:    fmt.Sprintf("and(rejected_code:eq:%s)", params.RejectedCode),
			ExpectedCode: http.StatusOK,
		},
		{
			ID:           "ST-C-02",
			Name:         "rejected_code - LIKE",
			Group:        "rejected_code",
			Condition:    fmt.Sprintf("and(rejected_code:like:%s)", params.RjCodeLike),
			ExpectedCode: http.StatusOK,
		},

		//---- Test Case argument: ref_ibp ----//
		{
			ID:           "RF-IBP-01",
			Name:         "ref_ibp - EQ",
			Group:        "ref_ibp",
			Condition:    fmt.Sprintf("and(ref_ibp:eq:%s)", params.RefIBP),
			ExpectedCode: http.StatusOK,
		},
		{
			ID:           "RF-IBP-02",
			Name:         "ref_ibp - LIKE",
			Group:        "ref_ibp",
			Condition:    fmt.Sprintf("and(ref_ibp:like:%s)", params.RefIBPLike),
			ExpectedCode: http.StatusOK,
		},

		//---- Test Case argument: amount ----//
		{
			ID:           "AMT-01",
			Name:         "amt - EQ",
			Group:        "amt",
			Condition:    fmt.Sprintf("and(amt:eq:%s)", params.Amount),
			ExpectedCode: http.StatusOK,
		},
		{
			ID:           "AMT-02",
			Name:         "amt - LIKE",
			Group:        "amt",
			Condition:    fmt.Sprintf("and(amt:like:%s)", params.AmountLike),
			ExpectedCode: http.StatusOK,
		},
		{
			ID:           "AMT-03", // MENOR O IGUAL QUE
			Name:         "amt - LTE",
			Group:        "amt",
			Condition:    fmt.Sprintf("and(amt:lte:%s)", params.AmountLTE),
			ExpectedCode: http.StatusOK,
		},
		{
			ID:           "AMT-04", // MAYOR O IGUAL QUE
			Name:         "amt - GTE",
			Group:        "amt",
			Condition:    fmt.Sprintf("and(amt:gte:%s)", params.AmountGTE),
			ExpectedCode: http.StatusOK,
		},
		{
			ID:           "AMT-05", // ENTRE
			Name:         "amt - BTWN",
			Group:        "amt",
			Condition:    fmt.Sprintf("and(amt:btwn:%s)", params.AmountBtwn),
			ExpectedCode: http.StatusOK,
		},
	}
}

// ExecuteCustomQuery ejecuta la condición armada desde el Query Builder
func (s *TestRunnerService) ExecuteCustomQuery(condition string) domain.QueryExecutionResponse {
	statusCode, rawBody, latency, err := s.sypagoClient.FetchTransactions(condition)

	resp := domain.QueryExecutionResponse{
		ConditionGenerated: condition,
		StatusCode:         statusCode,
		LatencyMs:          latency,
		RawResponse:        rawBody,
	}

	if err != nil && statusCode == 0 {
		resp.StatusCode = http.StatusInternalServerError
		resp.RawResponse = json.RawMessage(fmt.Sprintf(`{"error": "%s"}`, err.Error()))
	}
	return resp
}

// RunSuite valida la presencia de parámetros y ejecuta el grupo de pruebas solicitado
func (s *TestRunnerService) RunSuite(groupFilter string, params SuiteParams) ([]domain.TestResult, error) {
	if err := params.ValidateParams(); err != nil {
		return nil, err
	}

	allCases := s.GetTestCases(params)
	var results []domain.TestResult

	for _, tc := range allCases {
		if groupFilter != "" && groupFilter != "all" && tc.Group != groupFilter {
			continue
		}

		statusCode, rawBody, latency, err := s.sypagoClient.FetchTransactions(tc.Condition)

		result := domain.TestResult{
			ID:           tc.ID,
			TestCaseName: tc.Name,
			Group:        tc.Group,
			Condition:    tc.Condition,
			StatusCode:   statusCode,
			ExpectedCode: tc.ExpectedCode,
			LatencyMs:    latency,
			Passed:       true,
			RawResponse:  rawBody,
		}

		if err != nil {
			result.Passed = false
			result.Error = err.Error()
		} else if statusCode != tc.ExpectedCode {
			result.Passed = false
			result.Error = fmt.Sprintf("Código esperado %d, obtenido %d", tc.ExpectedCode, statusCode)
		}

		results = append(results, result)
	}

	return results, nil
}
