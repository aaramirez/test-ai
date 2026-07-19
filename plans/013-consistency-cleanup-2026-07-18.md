# 013 — Consistencia y limpieza del sistema quiz/survey

## Objetivo

Separar banks de survey de quiz, corregir paths en CLI, normalizar estructura, limpiar legacy, y actualizar docs.

## Arquitectura

### Decisión clave: separación de banks

```
quiz/
  banks/        ← solo banks de quiz (single, multiple)
  keys/         ← answer keys para quiz
  results/      ← resultados de quiz

surveys/
  banks/        ← solo banks de survey (type: survey)
  results/      ← resultados de survey
  registry.json
  visibility.json
  _index.json
```

**Por qué:** Los surveys no tienen keys, no se califican, y tienen su propio ciclo de vida. Mezclarlos en `quiz/banks/` crea confusión y fuerza filtros innecesarios.

## Requisitos

1. Crear directorio `surveys/banks/` y mover banks de survey ahí — prioridad: alta
2. Actualizar `quiz/lib/survey-session.js` para cargar banks desde `surveys/banks/` — prioridad: alta
3. Actualizar `quiz/lib/schema.js`: agregar `loadSurveyBank()`, `listSurveyBanks()` — prioridad: alta
4. Normalizar paths en `loadBank()`/`loadKey()` para aceptar ambos formatos — prioridad: alta
5. Agregar campo `type` a nivel bank en todos los banks — prioridad: alta
6. Corregir survey results con `selected` anidado (formato correcto: array plano) — prioridad: alta
7. Actualizar skill survey para buscar en `surveys/banks/` — prioridad: alta
8. Actualizar skill quiz para filtrar solo banks de quiz — prioridad: alta
9. Actualizar install.js para manejar `surveys/banks/` — prioridad: media
10. Eliminar `quiz/bank.json` legacy — prioridad: media
11. Eliminar `quiz/results.js` legacy — prioridad: media
12. Limpiar archivos `test-register-*.json` huérfanos — prioridad: media
13. Adaptar README.md (corregir paths, estructura, formato participant) — prioridad: media
14. Adaptar AGENTS.md (agregar surveys/banks/, actualizar tabla scripts) — prioridad: baja

## Archivos a crear

| Archivo | Contenido |
|---------|-----------|
| `surveys/banks/feedback-survey.json` | Movido de `quiz/banks/` |
| `surveys/banks/experiencia-encuesta.json` | Movido de `quiz/banks/` |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `quiz/lib/schema.js` | Normalizar paths, agregar `loadSurveyBank()`, `listSurveyBanks()`, `listQuizBanks()` |
| `quiz/lib/survey-session.js` | Cargar banks desde `surveys/banks/` en vez de `quiz/banks/` |
| `.opencode/skills/survey/SKILL.md` | Buscar en `surveys/banks/` en vez de `quiz/banks/` |
| `.opencode/skills/quiz/SKILL.md` | Filtrar solo banks de quiz |
| `quiz/banks/javascript.json` | Agregar `"type": "quiz"` |
| `quiz/banks/python.json` | Agregar `"type": "quiz"` |
| `quiz/banks/git.json` | Agregar `"type": "quiz"` |
| `quiz/banks/bash.json` | Agregar `"type": "quiz"` |
| `quiz/cli/install.js` | Incluir `surveys/banks/` en protected paths |
| `README.md` | Adaptar: corregir paths CLI, estructura de directorios, formato participant |
| `AGENTS.md` | Adaptar: agregar `surveys/banks/` en estructura, actualizar tabla scripts/skills |

## Archivos a eliminar

| Archivo | Razón |
|---------|-------|
| `quiz/banks/feedback-survey.json` | Movido a `surveys/banks/` |
| `quiz/banks/experiencia-encuesta.json` | Movido a `surveys/banks/` |
| `quiz/bank.json` | Legacy post-migración |
| `quiz/results.js` | Duplicado con session.js + git-results.js |
| `quiz/tests/test-register-*.json` | Archivos huérfanos de tests |

## TDD Flow

1. **RED** — Tests para `loadSurveyBank("feedback-survey.json")` y `listSurveyBanks()`
2. **GREEN** — Mover banks, actualizar schema.js y survey-session.js
3. **RED** — Tests para `listQuizBanks()` que excluya survey banks
4. **GREEN** — Agregar campo `type` y filtrado
5. **REFACTOR** — Verificar todo pasa

## Verificación

- [ ] `surveys/banks/` existe con 2 survey banks
- [ ] `quiz/banks/` solo tiene 4 quiz banks
- [ ] `loadBank("javascript.json")` funciona
- [ ] `loadBank("banks/javascript.json")` funciona
- [ ] `loadSurveyBank("feedback-survey.json")` funciona
- [ ] `listQuizBanks()` retorna solo banks de quiz
- [ ] `listSurveyBanks()` retorna solo banks de survey
- [ ] `validate-bank.js feedback-survey.json` (desde surveys/banks/) funciona
- [ ] Tests pasan (112+)
- [ ] CI validation pasa
- [ ] `quiz/bank.json` eliminado
- [ ] `quiz/results.js` eliminado
- [ ] `quiz/tests/test-register-*.json` eliminados
