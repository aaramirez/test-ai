# Sistema de Quiz — Guía de Administración

## Configuración Inicial (una sola vez)

### 1. Crear Bancos

```bash
# Crear un nuevo banco
node quiz/cli/create-bank.js --name "JavaScript Básico" --id javascript --version 1.0.0

# Agregar preguntas
node quiz/cli/add-question.js --bank banks/javascript.json \
  --id js-001 --type single --difficulty easy \
  --question "¿Cuál es la diferencia entre let y var?" \
  --options "var tiene ámbito de función" "let tiene ámbito de bloque"

# Validar
node quiz/cli/validate-bank.js banks/javascript.json
```

### 2. Crear Claves de Respuesta

```bash
# Crear clave desde el banco
node quiz/cli/create-key.js --bank banks/javascript.json

# Agregar respuestas
node quiz/cli/create-key.js --key keys/javascript.json \
  --add js-001 --correct 1 --explanation "let respeta los bloques"

# Validar clave contra el banco
node quiz/cli/validate-key.js --key keys/javascript.json --bank banks/javascript.json

# Cifrar clave
node quiz/cli/encrypt-key.js keys/javascript.json
```

### 3. Registrar Participantes

```bash
# Participante individual
node quiz/cli/manage-participants.js --add --id EST-001 --name "María García" --email "maria@ejemplo.com"

# Importación masiva desde CSV
node quiz/cli/manage-participants.js --import participantes.csv

# Listar todos
node quiz/cli/manage-participants.js --list
```

### 4. Subir a GitHub

```bash
git add .
git commit -m "feat(quiz): configuración inicial"
git push
```

## Operaciones Diarias

### Antes de una Sesión de Quiz

1. `git pull` — obtener los últimos bancos y lista de participantes
2. Verificar banco: `node quiz/cli/validate-bank.js banks/tema.json`
3. Verificar clave: `ls quiz/keys/tema.json`

### Durante una Sesión de Quiz

1. Los participantes toman el quiz mediante `/quiz-run`
2. Los resultados se guardan automáticamente en `quiz/results/<banco>/`
3. Los resultados se suben automáticamente a GitHub

### Después de una Sesión de Quiz

1. `git pull` — obtener todos los resultados nuevos
2. Generar reporte: `/quiz-report` → seleccionar banco
3. Revisar estadísticas por pregunta y puntajes de participantes
4. Enviar resultados: `/quiz-send` → seleccionar banco → confirmar destinatarios
5. Exportar CSV si es necesario: `node quiz/cli/admin-report.js --bank tema.json --csv reporte.csv`

## Gestión de Participantes

### Pre-registro desde CSV

1. Crear CSV con columnas: id, name, email, group
2. Ejecutar: `/quiz-register` → importar desde CSV
3. Verificar: `node quiz/cli/manage-participants.js --list`

### Ver Historial de Participante

```bash
node quiz/cli/manage-participants.js --history EST-001
```

### Filtrar Resultados por Participante

```bash
node quiz/cli/admin-report.js --participant EST-001
```

## Operaciones Masivas

### Envío Masivo de Resultados

```bash
node quiz/cli/send-results.js --bank javascript.json --all
```

### Evaluación Masiva

```bash
node quiz/cli/evaluate.js --bank javascript.json --all
```

## Ubicación de Archivos

| Ruta | Propósito | Commiteado |
|------|-----------|------------|
| `quiz/banks/` | Bancos de preguntas | ✅ Sí |
| `quiz/keys/` | Claves de respuesta | ❌ No (gitignored) |
| `quiz/results/` | Resultados de sesiones | ✅ Sí |
| `quiz/participants.json` | Registro de participantes | ✅ Sí |
| `quiz/results/_index.json` | Índice de sesiones | ✅ Sí |

## Solución de Problemas

### "Bank not found"
Verificar que el archivo del banco existe en `quiz/banks/` y que el nombre coincide.

### "Key not found"
Crear la clave primero: `node quiz/cli/create-key.js --bank banks/tema.json`

### "SMTP not configured"
El envío de correos requiere un archivo `.env` con configuración SMTP. Los resultados se guardan igual sin correo.

### "sops/age not installed"
El cifrado de claves es opcional. Las claves funcionan sin cifrado pero deben estar en gitignore.
