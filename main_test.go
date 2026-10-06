package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Estructuras adaptadas a la respuesta JSON real
type Amount struct {
	Type   string  `json:"type"`
	Amt    float64 `json:"amt"`
	PayAmt float64 `json:"pay_amt"`
	Curr   string  `json:"currency"`
	Rate   float64 `json:"rate"`
}

type DocumentInfo struct {
	Type   string `json:"type"`
	Number string `json:"number"`
}

type ReceivingUser struct {
	Name         string       `json:"name"`
	DocumentInfo DocumentInfo `json:"document_info"`
}

type Transaction struct {
	InternalID    string        `json:"internal_id"`
	TransactionID string        `json:"transaction_id"`
	RefIBP        string        `json:"ref_ibp"`
	GroupID       string        `json:"group_id"`
	OperationDate string        `json:"operation_date"`
	Amount        Amount        `json:"amount"`
	ReceivingUser ReceivingUser `json:"receiving_user"`
	Status        string        `json:"status"`
}

type TestCase struct {
	Name           string
	Condition      string
	ExpectedStatus int
	Validate       func(t *testing.T, data []Transaction)
}

func TestTransactionFilter_AllVariants(t *testing.T) {
	cfg := LoadConfig()
	client := &http.Client{Timeout: cfg.HTTPTimeout}

	// Valores de prueba
	user_id := "7066cf6f-5f6f-4d51-84f3-2684029b4f3a"    // usuario jescalona
	subuser_id := "4b3f48c1-bf67-483c-8d8d-93d36ae657f5" // subusuario jescalona@liomar
	targetTxID := "A60427ED515C"
	targetStatus := "RJCT"
	targetStatusMD := "MD01"
	targetRefIBP := "02301098"
	targetGroupID := "GRUPOID-12345678"
	minAmount := "100"
	maxAmount := "1000"

	minAmtFloat, _ := strconv.ParseFloat(minAmount, 64)
	maxAmtFloat, _ := strconv.ParseFloat(maxAmount, 64)

	testCases := []TestCase{

		// ==========================================
		// CAMPO: transaction_id
		// ==========================================
		{
			Name:           "transaction_id - EQ",
			Condition:      fmt.Sprintf("and(transaction_id:eq:%s)", targetTxID),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.Equal(t, targetTxID, item.TransactionID)
				}
			},
		},
		{
			Name:           "transaction_id - LIKE",
			Condition:      fmt.Sprintf("and(transaction_id:like:%s)", targetTxID[:5]),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.True(t, strings.Contains(item.TransactionID, targetTxID[:5]))
				}
			},
		},

		// ==========================================
		// CAMPO: status
		// ==========================================
		{
			Name:           "status - EQ",
			Condition:      fmt.Sprintf("and(status:eq:%s)", targetStatus),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.Equal(t, targetStatus, item.Status)
				}
			},
		},
		{
			Name:           "status - LIKE",
			Condition:      fmt.Sprintf("and(rejected_code:like:%s)", targetStatusMD[:3]),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.True(t, strings.Contains(item.Status, targetStatusMD[:3]))
				}
			},
		},

		// ==========================================
		// CAMPO: ref_ibp
		// ==========================================
		{
			Name:           "ref_ibp - EQ",
			Condition:      fmt.Sprintf("and(ref_ibp:eq:%s)", targetRefIBP),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.Equal(t, targetRefIBP, item.RefIBP)
				}
			},
		},
		{
			Name:           "ref_ibp - LIKE",
			Condition:      fmt.Sprintf("and(ref_ibp:like:%s)", targetRefIBP[4:]),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.True(t, strings.Contains(item.RefIBP, targetRefIBP[4:]))
				}
			},
		},

		// ==========================================
		// CAMPO: group_id
		// ==========================================
		{
			Name:           "group_id - EQ",
			Condition:      fmt.Sprintf("and(group_id:eq:%s)", targetGroupID),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.Equal(t, targetGroupID, item.GroupID)
				}
			},
		},

		// ==========================================
		// CAMPO: amount (Operadores Numéricos)
		// ==========================================
		{
			Name:           "amount - EQ",
			Condition:      fmt.Sprintf("and(amount:eq:%s)", minAmount),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.Equal(t, minAmtFloat, item.Amount.Amt)
				}
			},
		},
		{
			Name:           "amount - LTE",
			Condition:      fmt.Sprintf("and(amount:lte:%s)", maxAmount),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.LessOrEqual(t, item.Amount.Amt, maxAmtFloat)
				}
			},
		},
		{
			Name:           "amount - GTE",
			Condition:      fmt.Sprintf("and(amount:gte:%s)", minAmount),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.GreaterOrEqual(t, item.Amount.Amt, minAmtFloat)
				}
			},
		},
		{
			Name:           "amount - BTWN",
			Condition:      fmt.Sprintf("and(amount:btwn:%s|%s)", minAmount, maxAmount),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.GreaterOrEqual(t, item.Amount.Amt, minAmtFloat)
					assert.LessOrEqual(t, item.Amount.Amt, maxAmtFloat)
				}
			},
		},

		// ==========================================
		// 6. FILTROS COMBINADOS (Múltiples condiciones)
		// ==========================================
		{
			Name:           "COMBINADO - status EQ + amount BTWN",
			Condition:      fmt.Sprintf("and(status:eq:%s,amount:btwn:%s|%s)", targetStatus, minAmount, maxAmount),
			ExpectedStatus: http.StatusOK,
			Validate: func(t *testing.T, data []Transaction) {
				for _, item := range data {
					assert.Equal(t, targetStatus, item.Status)
					assert.GreaterOrEqual(t, item.Amount.Amt, minAmtFloat)
					assert.LessOrEqual(t, item.Amount.Amt, maxAmtFloat)
				}
			},
		},
	}

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			reqURL, err := url.Parse(cfg.BaseURL)
			require.NoError(t, err, "Error al parsear URL base")

			reqURL.RawQuery = "condition=" + tc.Condition

			t.Logf("URL enviada: %s", reqURL.String())

			req, err := http.NewRequest("GET", reqURL.String(), nil)
			require.NoError(t, err, "Error al crear la petición HTTP")

			req.Header.Set("Authorization", "Bearer "+cfg.AuthToken)
			req.Header.Set("Accept", "application/json")

			resp, err := client.Do(req)
			require.NoError(t, err, "Error al ejecutar la petición")
			defer resp.Body.Close()

			body, err := io.ReadAll(resp.Body)
			require.NoError(t, err, "Error al leer respuesta del body")

			if resp.StatusCode != tc.ExpectedStatus {
				t.Logf("Respuesta del servidor (%d): %s", resp.StatusCode, string(body))
			}

			assert.Equal(t, tc.ExpectedStatus, resp.StatusCode, "El Status Code retornado no coincide")

			if resp.StatusCode == http.StatusOK {
				var data []Transaction
				err = json.Unmarshal(body, &data)
				require.NoError(t, err, "El cuerpo devuelto no cumple la estructura JSON esperada")

				t.Logf("Status: %d | Registros devueltos: %d", resp.StatusCode, len(data))
				//si quiere ver los registros devueltos descomente.
				//t.Logf("JSON Respuesta: %s", string(body))

				if tc.Validate != nil {
					tc.Validate(t, data)
					fmt.Print("--------------------------------------------------------------------------------------------------------------------\n")
				}
			}
		})
	}
}
