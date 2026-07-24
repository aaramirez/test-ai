# Guia del Administrador de Encuestas

## Configuracion Inicial (Una Vez)

### 1. Crear un Banco de Encuestas

```bash
node quiz/cli/create-bank.js --name "Nombre de Encuesta" --id survey-id --type survey
```

### 2. Agregar Preguntas

```bash
node quiz/cli/add-question.js --bank surveys/banks/survey-id.json \
  --id srv-001 --text "Que tan satisfecho estás?" \
  --options "Muy satisfecho" "Satisfecho" "Neutral" "Insatisfecho"

node quiz/cli/add-question.js --bank surveys/banks/survey-id.json \
  --id srv-002 --text "Recomendarías este curso?" \
  --options "Si" "Tal vez" "No"
```

### 3. Validar

```bash
node quiz/cli/validate-bank.js surveys/banks/survey-id.json
```

### 4. Configurar Visibilidad (Opcional)

Edita `surveys/visibility.json`:

```json
{
  "survey-id.json": {
    "allowedGroups": ["estudiantes", "instructores"],
    "viewResultsGroups": ["admin"]
  }
}
```

- `allowedGroups`: Quienes pueden tomar la encuesta
- `viewResultsGroups`: Quienes pueden ver todos los resultados (solo admin)

## Operaciones Diarias

### Antes de una Sesion de Encuesta
1. Verifica que el banco de encuestas este completo y validado
2. Revisa la configuracion de visibilidad en `surveys/visibility.json`
3. Verifica que `surveys/registry.json` exista

### Durante una Sesion de Encuesta
1. El participante ejecuta `/survey`
2. El agente presenta preguntas, registra respuestas
3. Los resultados se guardan en `surveys/results/`

### Despues de una Sesion de Encuesta
1. Ejecuta `/survey-report` para ver estadisticas agregadas
2. Exporta CSV si necesitas analisis adicional
3. Revisa la distribucion de respuestas por pregunta

## Generar Reportes

### Via Comando

```bash
/survey-report
```

El agente:
1. Listara los bancos de encuestas disponibles
2. Te permitira seleccionar uno
3. Mostrara total de respuestas y desglose por pregunta
4. Ofrecera exportacion a CSV

### Via CLI

```bash
# Listar bancos disponibles
node quiz/cli/survey-admin-report.js --list

# Generar reporte
node quiz/cli/survey-admin-report.js --bank feedback-survey.json

# Exportar CSV
node quiz/cli/survey-admin-report.js --bank feedback-survey.json --csv reporte.csv
```

### Via API Programatica

```javascript
import { getSurveyStats, listSurveyBanks, generateSurveyReport } from './quiz/cli/survey-admin-report.js';

// Listar bancos
const bancos = listSurveyBanks();

// Obtener estadisticas
const stats = getSurveyStats('feedback-survey.json');
console.log(`Total de respuestas: ${stats.totalResponses}`);
console.log(stats.questionStats);

// Generar reporte de texto
const reporte = generateSurveyReport('feedback-survey.json');
```

## Formato del Banco de Encuestas

Los bancos de encuestas usan `type: "survey"` y no tienen respuestas correctas:

```json
{
  "id": "feedback",
  "type": "survey",
  "version": "1.0.0",
  "questions": [
    {
      "id": "srv-001",
      "type": "survey",
      "question": "Que tan satisfecho estás?",
      "options": ["Muy satisfecho", "Satisfecho", "Neutral"]
    }
  ]
}
```

## Ubicacion de Archivos

| Ruta | Proposito | Commiteado |
|------|-----------|------------|
| `surveys/banks/` | Bancos de preguntas | Si |
| `surveys/results/` | Resultados de sesiones | Si |
| `surveys/registry.json` | Seguimiento de completado | Si |
| `surveys/visibility.json` | Control de acceso por grupo | Si |
| `surveys/_index.json` | Indice de sesiones | Si |

## Formato de ID de Sesion

Prefijo: `s-` para sesiones de encuesta.

## Solucion de Problemas

### "Banco no encontrado"
- Verifica que el banco de encuestas exista en `surveys/banks/`
- Revisa que el nombre coincida exactamente

### No se muestran respuestas
- Verifica que existan resultados en `surveys/results/survey-id/`
- Revisa que el registro este actualizado

### Visibilidad no funciona
- Revisa `surveys/visibility.json` para nombres de grupos correctos
- Verifica los grupos del participante en `team.json`

### CSV exporta vacio
- Asegurate de haber respuestas antes de exportar
- Revisa que el nombre del banco coincida exactamente

## Relacionado

- [Guia del Participante](participante.md) — Como tomar encuestas
- [Referencia Rapida](referencia-rapida.md) — Todos los comandos de encuestas
