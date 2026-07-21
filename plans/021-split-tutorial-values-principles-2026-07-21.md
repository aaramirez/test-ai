# Split Agile Tutorial: 4 Values + 12 Principles

## Objective
Split the current "principios-agilidad" tutorial into two focused tutorials: `valores-agilidad` (4 values) and `principios-agilidad` (12 principles).

## Requirements
1. Rename current tutorial to `valores-agilidad` focusing only on the 4 values — priority: high
2. Rename principles tutorial to `principios-agilidad` — priority: high
3. Update answer keys for both tutorials — priority: high
4. Delete previous session results — priority: high
5. All user-facing text must be in Spanish with proper accents — priority: high
6. Validate both tutorials and keys — priority: high

## Architecture

### Files to Modify
- `tutorials/banks/principios-agilidad.json` — replace with 12 principles content
- `tutorials/keys/principios-agilidad.json` — replace with 12 principles answers

### Files to Create
- `tutorials/banks/valores-agilidad.json` — new tutorial for 4 values
- `tutorials/keys/valores-agilidad.json` — new answer key for values

### Files to Delete
- `tutorials/sessions/*.json` — previous session results

### Decisions
- New IDs: `valores-agilidad` (4 values), `principios-agilidad` (12 principles)
- Both tutorials in Spanish with proper accents
- Add `language: "es"` field to both
- All UI text in Spanish (resumen, continuar, correcto, etc.)

## Tutorial 1: `valores-agilidad` (4 Values)

| Paso | Tipo | Contenido |
|------|------|-----------|
| intro | content | Introducción a la Agilidad |
| valores | content | Los 4 Valores del Manifiesto Ágil |
| q-valores | question | Pregunta sobre qué se prioriza sobre documentación |
| escenario-001 | scenario | Decisión Crítica (cambio de requisitos) |
| resumen | content | Resumen |

## Tutorial 2: `principios-agilidad` (12 Principles)

| Paso | Tipo | Contenido |
|------|------|-----------|
| intro | content | Introducción a los 12 Principios |
| principios-lista | content | Los 12 principios organizados |
| q-principios-1 | question | Pregunta sobre satisfacer al cliente |
| q-principios-2 | question | Pregunta sobre aceptar el cambio |
| escenario-001 | scenario | Aplicación en el mundo real |
| checkpoint-001 | checkpoint | Verificación final |
| resumen | content | Resumen |

## TDD Flow
1. Create `valores-agilidad.json` with 4 values content
2. Create `valores-agilidad.json` key
3. Replace `principios-agilidad.json` with 12 principles content
4. Replace `principios-agilidad.json` key with 12 principles answers
5. Delete previous session results
6. Run `validate-tutorial.js` on both tutorials
7. Run `validate-tutorial.js --key` on both keys

## Verification
- [ ] Tutorial `valores-agilidad` passes validation
- [ ] Tutorial `principios-agilidad` passes validation
- [ ] Both keys pass validation
- [ ] Spanish accents are correct in both tutorials
- [ ] No duplicate content between tutorials
- [ ] Previous session results deleted
- [ ] All user-facing text is in Spanish
