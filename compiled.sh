#!/bin/bash
echo "1. Compilando Frontend (React)..."
cd frontend && npm run build && cd ..

echo "2. Compilando Ejecutable (.exe para Windows)..."
GOOS=windows GOARCH=amd64 go build -o bin/api-filter-tests.exe cmd/main.go

echo "3. Compilando Ejecutable para Linux..."
GOOS=linux GOARCH=amd64 go build -o bin/api-filter-tests-linux cmd/main.go

echo "¡Listo! Los ejecutables portables están en la carpeta /bin"