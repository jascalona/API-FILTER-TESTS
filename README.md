### Estructura de Suite

### Definicion del consumo via CLI

Este código cubre todas las combinaciones de campos (user_id, subuser_id, internal_id, transaction_id, ref_ibp, group_id, InitTransactionDate, operation_date, amount_type, amt, pay_amt, currency, rate, name, document_type, number, bank_code, account_type, account_number, status, rejected_code, operationSecret) y los operadores (eq, like, lte, gte, btwn): definidos en la documentacion: https://app.sypago.net/docs/api_filters

### Ejecute todas las pruebas con salida detallada
```
# Muestra el nombre de cada prueba, si pasó o falló y las aserciones correspondientes
go test -v .
```

### Ejecutar una prueba o filtro específico por nombre
```
# Ejecutar por nombre del TestCase
go test -v -run "TestTransactionFilter_AllVariants/EQ - transaction_id" .

# Tambien puede ejecutar la prueba de btwn o múltiples filtros:

# Ejecuta solo las pruebas que contengan 'BTWN' en el nombre
go test -v -run "BTWN" .

# Ejecuta solo las pruebas que contengan 'Múltiples'
go test -v -run "Múltiples" .
```

### Para ejecucion rapida por Grupos
```
# probar solo casos amount
go test -v -run "TestTransactionFilter_AllVariants/amount" .


# probar solo casos operadores LIKE
go test -v -run "TestTransactionFilter_AllVariants/.*LIKE" .
```

### Composicion de la Suite (Monorepo)
```
api-filter-tests/
├── cmd/
│   └── main.go                 # Punto de entrada principal
├── internal/
│   ├── client/
│   ├── handler/
│   ├── model/
│   └── service/
├── frontend/                   # Repositorio/Código de React (Vite / CRA)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── dist/                   # Salida del build estático de React
├── .env
├── go.mod
└── go.sum
```
Detalles para los gochos: 

Dominio (internal/domain): Define los structs (petición de filtros, respuesta de transacción, resultado de test case). No importa nada externo.

Cliente (internal/client): Se encarga de la conectividad HTTP pura contra SyPago.

Servicio (internal/service): Lógica pura de Go. Construye la sintaxis de filtros y evalúa las reglas de los tests.

Manejador (internal/handler): Adapta la entrada y salida de HTTP usando la librería Gin para entregársela limpia a React.



### Dise~o del flujo desacoplado

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React Dashboard)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (HTTP Request / JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 1. HANDLERS (Gin Controllers)                                          │
│    Reciben la petición HTTP, parsean el JSON y validan el formato.     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. SERVICES (Lógica de Negocio)                                        │
│    - QueryBuilder: Transforma el JSON del Front en "and(status:eq:...)"│
│    - TestRunner: Contiene la lista maestra de Test Cases y los evalúa. │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. CLIENT / ADAPTER (Cliente HTTP Externo)                             │
│    Ensambla la URL final y realiza la llamada real hacia SyPago.       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (HTTP Request / Bearer Token)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API EXTERNA (SyPago Staging)                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Flujo X: Constructor Dinámico de Consultas Personalizadas (Custom Request Builder)

Permite al usuario construir filtros condicionales complejos y anidados mediante una interfaz gráfica interactiva en React. La aplicación traduce la estructura de árbol JSON enviada desde la web en la sintaxis funcional de filtrado requerida por la API de SyPago (and(...) / or(...)).

## Payload de Entrada (POST /api/v1/custom-filter)
El frontend construye un árbol dinámico de reglas y subgrupos. La petición se envía mediante un método POST conteniendo la estructura inmutable del árbol:

```
# Ejemplo estructural del json enviado filtro con reglas simples

POST | http://localhost:8050/api/v1/custom-filter
# NOTA: Puede agregar "N" cantidad de reglas como desee para anidar los query 

{
  "operator": "and",
  "children": [
    {
      "field": "status",
      "op": "eq",
      "value": "ACCP"
    },
    {
      "field": "amt",
      "op": "btwn",
      "value": "10|100"
    }   
  ]
}

# Ejemplo de construccion via api interna: and(status:eq:ACCP,amt:btwn:10|100)

```



### Estructura de Respuesta Devuelta al Frontend
El backend consolida el resultado de la ejecución, permitiendo que la interfaz renderice tanto las métricas de inspección técnica como la respuesta original devuelta por SyPago:

```
{
  "generated_condition": "and(status:eq:ACCP,or(amount:btwn:10|100,rejected_code:like:TKCM))",
  "target_url": "https://pruebas.api.sypago.net/api/v1/transaction/filter?condition=and(status:eq:ACCP,or(amount:btwn:10|100,rejected_code:like:TKCM))",
  "status_code": 200,
  "latency_ms": 315,
  "raw_response": [
    {
      "internal_id": "F0B86F773377",
      "transaction_id": "A60427ED515C",
      "status": "ACCP",
      "amount": {
        "pay_amt": 50,
        "currency": "VES"
      }
    }
  ]
}
```



Gin Handler (filter_handler.go) recibe la petición y se la pasa al Service.

QueryBuilder Service (query_builder.go) procesa el arreglo de reglas y construye el string codificado para el query param:
and(status:eq:ACCP,amount:btwn:10|100)

Client Adapter (sypago_client.go) toma la string, le pega la URL base ([https://pruebas.api.sypago.net/api/v1/transaction/filter?condition=](https://pruebas.api.sypago.net/api/v1/transaction/filter?condition=)...), agrega las cabeceras de autorización (Bearer TOKEN) y mide el tiempo de respuesta (latencia).

Respuesta al Front: El Handler devuelve un JSON con la cadena generada, el tiempo de respuesta en ms, el código HTTP y el payload devuelto por SyPago para renderizarlo en la tabla.

### Flujo Y: Flujo de querys precargados en la Suite por el papa

Este flujo ocurre cuando el usuario entra a la pestaña "Test Cases" y hace clic en "Ejecutar Suite Completa" o "Probar grupo Amount".
NOTA: Para esta primera version no contamos con una BD dedicada como SQL-Lite y los test-case renderizados en el cliente, estan precargados en el servicio

React envía una petición: POST /api/v1/test-suites/run con el payload {"group": "amount"}.

Gin Handler (test_handler.go) invoca al TestRunner Service.

TestRunner Service (test_runner.go):

Consulta el catalogo maestro de pruebas (GetTestCases()).

Filtra los casos según el grupo solicitado.

Itera sobre cada TestCase, ejecuta la llamada a SyPago a través del Client Adapter y captura la respuesta.

Ejecuta la función de aserción/validación de cada caso (ej. comprobar que el arreglo de objetos devuelto cumpla con las condiciones esperadas o gestionar la respuesta 404 sin romper el flujo).

Respuesta al Front: Devuelve una matriz de resultados lista para pintar:

```
{
  "total": 1,
  "results": [
    {
      "id": "AM-01",
      "name": "amount - BTWN",
      "condition": "and(amount:btwn:10|100)",
      "status_code": 200,
      "latency_ms": 142,
      "passed": true,
      "error": ""
    }
  ]
}
```
### Consumo de TestRunner (Catalogo de test-case (Suite))

Para realizar el consumo de este servicio, atravez de un cliente http (react, postman, etc...) es importante pasar el payload 
NOTA: El token viaja directamente en el servicio, solo asegurese de cargarlo en el .env
```
curl -X POST http://localhost:8050/api/v1/test-suites/run?group=all \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "A60427ED515C",
    "tx_like": "A604",
    "status": "ACCP",
    "rejected_code": "TKCM",
    "rj_code_like": "MD",
    "ref_ibp": "02301098",
    "ref_ibp_like": "1098",
    "amount": "1",
    "amount_like": "1000",
    "amount_lte": "1000",
    "amount_gte": "1000",
    "amount_btwn": "10|100"
  }'
```