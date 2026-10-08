package domain

import "fmt"

type MapperError struct {
	StatusCode int
	Message    interface{}
}

func (e *MapperError) Error() string {
	return fmt.Sprintf("Error Generado en el servicio externo: Status: %d, Message: %v", e.StatusCode, e.Message)
}
