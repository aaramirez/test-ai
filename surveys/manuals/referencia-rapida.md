# Referencia Rapida de Encuestas

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `/survey` | Verificar encuestas pendientes y enviar respuestas |
| `/survey-report` | Generar reportes de admin — estadisticas, CSV |
| `/survey-create` | Crear un nuevo banco de encuestas |

## Scripts CLI

### Crear Banco de Encuestas
```bash
node quiz/cli/create-bank.js --name "Nombre" --id id --type survey
```

### Agregar Pregunta
```bash
node quiz/cli/add-question.js --bank surveys/banks/id.json \
  --id srv-001 --text "Pregunta?" --options "A" "B" "C"
```

### Validar
```bash
node quiz/cli/validate-bank.js surveys/banks/id.json
```

### Generar Reporte
```bash
node quiz/cli/survey-admin-report.js --list
node quiz/cli/survey-admin-report.js --bank survey.json
node quiz/cli/survey-admin-report.js --bank survey.json --csv reporte.csv
```

## API Programatica

```javascript
import { getSurveyStats, listSurveyBanks, generateSurveyReport, generateSurveyReportCSV } from './quiz/cli/survey-admin-report.js';
```

## Control de Visibilidad

Edita `surveys/visibility.json`:

```json
{
  "survey.json": {
    "allowedGroups": ["estudiantes"],
    "viewResultsGroups": ["admin"]
  }
}
```

## Ubicacion de Archivos

| Ruta | Proposito | Commiteado |
|------|-----------|------------|
| `surveys/banks/` | Bancos de encuestas | Si |
| `surveys/results/` | Resultados de sesiones | Si |
| `surveys/registry.json` | Seguimiento de completado | Si |
| `surveys/visibility.json` | Control de acceso | Si |

## Formato de ID de Sesion

Prefijo: `s-` para sesiones de encuesta.

## Relacionado

- [Guia del Participante](participante.md) |
- [Guia del Administrador](admin-guia.md)
