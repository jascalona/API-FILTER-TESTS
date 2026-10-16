#!/bin/bash

# Detener la ejecución si ocurre algún error
set -e

echo "[+] Iniciando proceso de compilación para despliegue externo (Windows)..."

# 1. Compilar el Frontend en React
echo "[+] 1/4 Compilando estáticos del Frontend (React/Vite)..."
cd frontend
npm run build
cd ..

# 2. Copiar los estáticos compilados a internal/static/dist
echo "[+] 2/4 Copiando dist a internal/static/dist..."
mkdir -p internal/static/dist
rm -rf internal/static/dist/*
cp -r frontend/dist/* internal/static/dist/

# 3. Asegurar que exista el directorio de destino bin/
mkdir -p bin

# 4. Compilación cruzada en Go para Windows 64-bit
echo "[+] 3/4 Compilando Go para Windows (GOOS=windows GOARCH=amd64)..."
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o bin/app.exe cmd/main.go

# 5. Copiar el archivo .env a bin/
echo "[+] 4/4 Sincronizando archivo .env en bin/..."
if [ -f .env ]; then
    cp -u .env bin/.env
    echo "    - Archivo .env copiado a bin/"
else
    echo "    - ADVERTENCIA: No se encontró .env en la raíz del proyecto."
fi

echo ""
echo "[+] Proceso completado con éxito."
echo "[+] Revisa la carpeta 'bin/' — Contiene:"
echo "    ├── app.exe"
echo "    └── .env"