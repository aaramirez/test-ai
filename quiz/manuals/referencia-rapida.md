# Sistema de Quiz — Referencia Rápida

## Comandos

| Comando | Descripción |
|---------|-------------|
| `/quiz-create` | Crear un nuevo banco |
| `/quiz-register` | Registrar participantes |
| `/quiz-practice` | Quiz de práctica (con retroalimentación) |
| `/quiz-run` | Quiz en vivo (resultados guardados) |
| `/quiz-report` | Reporte de administración |
| `/quiz-send` | Enviar resultados por correo |
| `/quiz-migrate` | Migrar banco heredado |
| `/quiz-install` | Instalar sistema en otro directorio |
| `/quiz-install-update` | Actualizar instalación existente |
| `/key-mgmt` | Gestión de claves multi-persona |
| `/survey` | Tomar encuestas pendientes |
| `/survey-report` | Reportes de admin de encuestas |
| `/survey-create` | Crear bancos de encuestas |
| `/tutorial` | Ejecutar tutorial interactivo |
| `/tutorial-create` | Crear nuevo tutorial |
| `/tutorial-report` | Reportes de completado de tutoriales |
| `/tutorial-key` | Gestión de claves de tutoriales |

## Ubicación de Archivos

| Ruta | Propósito |
|------|-----------|
| `quiz/banks/` | Bancos de preguntas (compartibles) |
| `quiz/keys/` | Claves de respuesta (solo admin, cifradas) |
| `quiz/results/` | Resultados de sesiones (commiteados) |
| `tutorials/banks/` | Contenido de tutoriales |
| `tutorials/keys/` | Claves de tutoriales (gitignored) |
| `tutorials/sessions/` | Resultados de sesiones de tutoriales |
| `surveys/banks/` | Bancos de encuestas |
| `surveys/results/` | Resultados de sesiones de encuestas |
| `team.json` | Registro de participantes |
| `id.json` | Lookup rápido por cédula |
| `quiz/results/_index.json` | Índice de sesiones |
| `quiz/manuals/` | Documentación |

## Flujo del Participante

1. `/quiz-register` (admin) o auto-registro en primer `/quiz-run`
2. `/quiz-practice` (opcional)
3. `/quiz-run` (enviar)
4. `/quiz-send` (admin envía resultados)

## Flujo del Administrador

1. `/quiz-create` → agregar preguntas
2. create-key → encrypt-key
3. `/quiz-register` → importar participantes
4. git push
5. Esperar a los participantes
6. git pull → `/quiz-report` → `/quiz-send`

## Formato de ID de Sesión

| Prefijo | Modo |
|---------|------|
| `q-` | Quiz en vivo |
| `p-` | Práctica |
| `s-` | Encuesta |
| `t-` | Tutorial |

## Scripts Principales

```bash
# Gestión de bancos
node quiz/cli/create-bank.js --name "Tema" --id tema
node quiz/cli/add-question.js --bank banks/tema.json --id p-001 ...
node quiz/cli/validate-bank.js banks/tema.json

# Gestión de claves
node quiz/cli/create-key.js --bank banks/tema.json
node quiz/cli/validate-key.js --key keys/tema.json --bank banks/tema.json
node quiz/cli/encrypt-key.js keys/tema.json

# Gestión de claves multi-persona
node quiz/cli/manage-keys.js --upload-key --id ID --public-key KEY
node quiz/cli/manage-keys.js --approve --id ID
node quiz/cli/manage-keys.js --reject --id ID --reason "..."
node quiz/cli/manage-keys.js --grant --key KEY --read ID,GROUP
node quiz/cli/manage-keys.js --revoke --key KEY --read ID
node quiz/cli/manage-keys.js --list-keys
node quiz/cli/manage-keys.js --list-access
node quiz/cli/manage-keys.js --who-access-for --id ID

# Gestión de participantes
node quiz/cli/manage-participants.js --list
node quiz/cli/manage-participants.js --add --id ID --name "Nombre"
node quiz/cli/manage-participants.js --import file.csv

# Evaluación y reportes
node quiz/cli/evaluate.js --bank javascript.json --all
node quiz/cli/admin-report.js --bank javascript.json
node quiz/cli/admin-report.js --participant EST-001

# Admin de encuestas
node quiz/cli/survey-admin-report.js --list
node quiz/cli/survey-admin-report.js --bank feedback.json
node quiz/cli/survey-admin-report.js --bank feedback.json --csv reporte.csv

# Resultados
node quiz/cli/send-results.js --bank javascript.json --list
node quiz/cli/send-results.js --bank javascript.json --all

# Gestión de claves de tutoriales
node tutorials/cli/create-key.js --bank banks/tutorial.json
node tutorials/cli/create-key.js --key keys/tutorial.json --add step-001 --correct 1
node tutorials/cli/create-key.js --list

# Instalación
node quiz/cli/install.js --dry-run --verbose --dir /ruta/destino
node quiz/cli/install.js --dir /ruta/destino
```
