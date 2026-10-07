package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"api-filter-tests/config"
)

type SypagoClient struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

func NewSypagoClient(cfg *config.Config) *SypagoClient {
	return &SypagoClient{
		baseURL: cfg.SypagoBaseURL,
		token:   cfg.SypagoToken,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// SetToken permite actualizar el token dinamicamente en tiempo de ejecución si el usuario lo cambia desde el Front
func (c *SypagoClient) SetToken(newToken string) {
	c.token = newToken
}

func (c *SypagoClient) FetchTransactions(condition string) (int, json.RawMessage, int64, error) {
	// Construir la URL con el query param 'condition'
	endpoint := fmt.Sprintf("%s/api/v1/transaction/filter", c.baseURL)
	reqURL, err := url.Parse(endpoint)
	if err != nil {
		return 0, nil, 0, fmt.Errorf("error parseando la URL base: %w", err)
	}

	q := reqURL.Query()
	q.Set("condition", condition)
	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequest(http.MethodGet, reqURL.String(), nil)
	if err != nil {
		return 0, nil, 0, fmt.Errorf("error creando la petición HTTP: %w", err)
	}

	// Encabezados estándar
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.token))
	req.Header.Set("Accept", "application/json")

	// Medir latencia
	start := time.Now()
	resp, err := c.httpClient.Do(req)
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return 0, nil, latency, fmt.Errorf("error ejecutando la llamada a SyPago: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, nil, latency, fmt.Errorf("error leyendo el cuerpo de respuesta: %w", err)
	}

	// Si la respuesta es vacía o nula, devolvemos un JSON válido vacío []
	if len(bodyBytes) == 0 {
		bodyBytes = []byte("[]")
	}

	return resp.StatusCode, json.RawMessage(bodyBytes), latency, nil
}
