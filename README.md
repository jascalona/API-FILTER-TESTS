### Estructura de Suite

```
api-filter-tests/
├── main_test.go      # Suite principal de pruebas
├── config.go         # Constantes y cliente HTTP
└── go.mod
```

### Definicion 

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