package static

import (
	"embed"
)

// Embebe todo el contenido del directorio local dist
//go:embed all:dist
var Files embed.FS
