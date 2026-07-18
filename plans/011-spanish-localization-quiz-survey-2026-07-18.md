# 011 — Localización al español de quiz y survey

## Objetivo

Traducir al español todo el contenido visible de los módulos de quiz y survey: descripciones de banks, preguntas, opciones de selección, mensajes del mailer, y textos de cierre.

## Requisitos

1. Traducir `description` de todos los banks en `quiz/banks/*.json` — prioridad: alta
2. Traducir el bank `feedback-survey.json` completo (nombre, descripción, preguntas, opciones) — prioridad: alta
3. Corregir `quiz/lib/mailer.js` líneas 33/35: `"Correct"` → `"Correcto"`, `"Incorrect"` → `"Incorrecto"` — prioridad: alta
4. Verificar que `experiencia-encuesta.json` ya está en español (sin cambios) — prioridad: baja
5. No traducir: nombres técnicos (`var`, `let`, `null`, `undefined`), código, claves JSON, nombres de archivos — prioridad: baja
6. No traducir: mensajes de sistema en CLI scripts ni en lib (son para desarrolladores) — prioridad: baja
7. No traducir: test files (son para desarrolladores) — prioridad: baja
8. No traducir: documentación en `quiz/manuals/` (ya existen versiones en español) — prioridad: baja

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `quiz/banks/feedback-survey.json` | Traducir nombre, descripción, 2 preguntas, 10 opciones |
| `quiz/banks/javascript.json` | Traducir `description` |
| `quiz/banks/python.json` | Traducir `description` |
| `quiz/banks/git.json` | Traducir `description` |
| `quiz/banks/bash.json` | Traducir `description` |
| `quiz/lib/mailer.js` | Línea 33: `"Correct"` → `"Correcto"`, línea 35: `"Incorrect"` → `"Incorrecto"` |

## Archivos sin cambios necesarios

| Archivo | Razón |
|---------|-------|
| `quiz/banks/experiencia-encuesta.json` | Ya está en español |
| `quiz/cli/*.js` | Mensajes de sistema para desarrolladores, no contenido de preguntas |
| `quiz/lib/schema.js` | Mensajes de validación para desarrolladores |
| `quiz/lib/participant.js` | Mensajes de sistema para desarrolladores |
| `quiz/lib/admin-report.js` | Reportes para admin, no contenido de preguntas |
| `quiz/tests/*.js` | Tests para desarrolladores |
| `quiz/manuals/*.md` | Ya existen versiones en español |

## TDD Flow

1. **RED** — Escribir test que verifique que los banks tienen `description` en español y que `feedback-survey.json` tiene contenido en español
2. **GREEN** — Traducir los archivos
3. **REFACTOR** — Verificar que todos los tests pasan

## Cambios detallados

### 1. `quiz/banks/feedback-survey.json`

```json
{
  "name": "Encuesta de Satisfacción",
  "description": "Encuesta de satisfacción post-curso",
  "questions": [
    {
      "id": "srv-001",
      "question": "¿Qué tan satisfecho estás con el curso?",
      "options": [
        { "label": "Muy satisfecho" },
        { "label": "Satisfecho" },
        { "label": "Neutral" },
        { "label": "Insatisfecho" },
        { "label": "Muy insatisfecho" }
      ]
    },
    {
      "id": "srv-002",
      "question": "¿Qué tan probable es que recomiendes este curso?",
      "options": [
        { "label": "Muy probable" },
        { "label": "Probable" },
        { "label": "Neutral" },
        { "label": "Improbable" },
        { "label": "Muy improbable" }
      ]
    }
  ]
}
```

### 2. `quiz/banks/javascript.json`

```json
"description": "Conceptos fundamentales de JavaScript"
```

### 3. `quiz/banks/python.json`

```json
"description": "Fundamentos de Python"
```

### 4. `quiz/banks/git.json`

```json
"description": "Conceptos de control de versiones Git"
```

### 5. `quiz/banks/bash.json`

```json
"description": "Conceptos de línea de comandos Bash"
```

### 6. `quiz/lib/mailer.js`

Línea 33: `Correct` → `Correcto`
Línea 35: `Incorrect` → `Incorrecto`

## Verificación

- [ ] Tests pasan (`node --test quiz/tests/*.test.js`)
- [ ] `feedback-survey.json` tiene todo el contenido en español
- [ ] Todos los banks tienen `description` en español
- [ ] `mailer.js` usa "Correcto"/"Incorrecto"
- [ ] `experiencia-encuesta.json` sin cambios (ya en español)
- [ ] CI validation pasa
