# Comprehensive Testing Plan: test-ai Full Validation

## Objective
Test every component of test-ai step by step with human validation, fixing errors as we go, reinstalling to ../test-ai-test after each fix, and creating regression tests.

## Roles

- **Agente (yo):** Ejecuto tests automatizados, ci-validate, validaciones de estructura, y creo fixes
- **Usuario (tú):** Ejecutas los comandos interactivos (/quiz-install, /quiz-create, etc.) y reportas resultados

## Human-in-the-Loop Process

Each step follows this cycle:
1. **Instruir** — te doy el comando exacto a ejecutar
2. **Ejecutar** — tú lo ejecutas en el TUI o terminal
3. **Reportar** — me pasas el output/resultados
4. **Validar** — verifico si está correcto
5. **Corregir** — si hay error, fix en el código
6. **Reinstalar** — ejecuto `node quiz/cli/install.js --dir ../test-ai-test`
7. **Verificar en instalado** — confirmo que el fix funciona
8. **Documentar** — registro error + test de regresión si aplica
9. **Ajustar plan** — reviso y ajusto siguientes pasos

---

## Fase 1: Validación Base

### Paso 1.1: Ejecutar tests existentes (AGENTE)
```
node --test
```
**Resultado:** 246/246 pasan ✅

### Paso 1.2: Ejecutar ci-validate en fuente (AGENTE)
```
node .opencode/scripts/ci-validate.js
```
**Resultado:** All checks passed ✅

### Paso 1.3: /quiz-install (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/install.js --dir ../test-ai-test
```
**Reporta:** ¿Cuántos archivos? ¿Algún error?

### Paso 1.4: ci-validate en instalado (AGENTE)
Yo ejecuto después de tu install.

### Paso 1.5: Verificar estructura (AGENTE)
Yo verifico la estructura automáticamente.

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 1.**

---

## Fase 2: Quiz System — Banco y Clave

### Paso 2.1: /quiz-create (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/create-bank.js --name "Test Bank" --id test-bank
```
**Reporta:** ¿Se creó quiz/banks/test-bank.json?

### Paso 2.2: Agregar preguntas (USUARIO)
**Ejecuta estos comandos:**
```
node quiz/cli/add-question.js --bank quiz/banks/test-bank.json --id q-001 --question "¿Capital de Francia?" --options "Madrid" "París" "Roma" --correct "París" --difficulty easy --hint "Ciudad de la torre Eiffel"
```
```
node quiz/cli/add-question.js --bank quiz/banks/test-bank.json --id q-002 --question "¿Cuánto es 2+2?" --options "3" "4" "5" --correct "4" --difficulty medium
```
```
node quiz/cli/add-question.js --bank quiz/banks/test-bank.json --id q-003 --question "¿Quién escribió Cien Años de Soledad?" --options "Vargas Llosa" "García Márquez" "Borges" --correct "García Márquez" --difficulty hard
```
**Reporta:** ¿Se agregaron las 3 preguntas?

### Paso 2.3: Validar banco (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/validate-bank.js quiz/banks/test-bank.json
```
**Reporta:** ¿Es válido?

### Paso 2.4: Crear clave (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/create-key.js --bank quiz/banks/test-bank.json
```
**Reporta:** ¿Se creó quiz/keys/test-bank.json?

### Paso 2.5: Validar clave (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/validate-key.js --key quiz/keys/test-bank.json --bank quiz/banks/test-bank.json
```
**Reporta:** ¿Es válida?

### Paso 2.6: Encriptar clave (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/encrypt-key.js quiz/keys/test-bank.json
```
**Reporta:** ¿Se encriptó?

### Paso 2.7: Verificar encriptación (USUARIO)
**Ejecuta este comando:**
```
cat quiz/keys/test-bank.json
```
**Reporta:** ¿Está encriptada? (No debe mostrar respuestas en texto plano)

### Paso 2.8: Reinstalar (AGENTE)
Yo ejecuto install después de verificación.

### Paso 2.9: Verificar user data protegido (AGENTE)
Yo verifico que test-bank.json NO se copió a ../test-ai-test.

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 2.**

---

## Fase 3: Quiz System — Ejecución

### Paso 3.1: /quiz-practice (USUARIO)
**Ejecuta este comando:**
```
echo "París" | node quiz/cli/run-quiz.js --bank quiz/banks/test-bank.json --practice
```
**Reporta:** ¿Funciona? ¿Muestra feedback?

### Paso 3.2: /quiz-run (USUARIO)
**Ejecuta este comando:**
```
echo "París" | node quiz/cli/run-quiz.js --bank quiz/banks/test-bank.json --live
```
**Reporta:** ¿Se guardaron resultados en quiz/results/?

### Paso 3.3: /quiz-report (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/evaluate.js --bank quiz/banks/test-bank.json --all
```
**Reporta:** ¿Muestra scores correctos?

### Paso 3.4: Admin report (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/admin-report.js --bank quiz/banks/test-bank.json
```
**Reporta:** ¿Se genera el reporte?

### Paso 3.5: Reinstalar (AGENTE)
Yo ejecuto install.

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 3.**

---

## Fase 4: Tutorial System E2E

### Paso 4.1: /tutorial-create (USUARIO)
**Ejecuta este comando:**
```
node tutorials/cli/create-tutorial.js --name "Test Tutorial" --id test-tutorial --difficulty easy --duration 2
```
**Reporta:** ¿Se creó tutorials/banks/test-tutorial.json?

### Paso 4.2: Agregar pasos (USUARIO)
**Ejecuta estos comandos:**
```
node tutorials/cli/add-step.js --tutorial tutorials/banks/test-tutorial.json --id step-001 --type content --title "Intro" --body "Contenido de prueba"
```
```
node tutorials/cli/add-step.js --tutorial tutorials/banks/test-tutorial.json --id q-001 --type question --question "¿Pregunta?" --options "A" "B" "C" --correct "A"
```
```
node tutorials/cli/add-step.js --tutorial tutorials/banks/test-tutorial.json --id sc-001 --type scenario --title "Escenario" --narrative "Situación de prueba" --options "Opción 1" "Opción 2" --correct "Opción 1" --feedback "¡Correcto!"
```
```
node tutorials/cli/add-step.js --tutorial tutorials/banks/test-tutorial.json --id cp-001 --type checkpoint --question "Checkpoint" --options "X" "Y" --min-score 1
```
**Reporta:** ¿Se agregaron los 4 pasos?

### Paso 4.3: Validar tutorial (USUARIO)
**Ejecuta este comando:**
```
node tutorials/cli/validate-tutorial.js test-tutorial.json
```
**Reporta:** ¿Es válido?

### Paso 4.4: Crear clave (USUARIO)
Crear `tutorials/keys/test-tutorial.json` con answers correctas.

### Paso 4.5: Validar clave (USUARIO)
**Ejecuta este comando:**
```
node tutorials/cli/validate-tutorial.js --key tutorials/keys/test-tutorial.json test-tutorial.json
```
**Reporta:** ¿Es válida?

### Paso 4.6: Reinstalar (AGENTE)
Yo ejecuto install.

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 4.**

---

## Fase 5: Credenciales y Encriptación

### Paso 5.1: Verificar evaluate con clave encriptada (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/evaluate.js --bank quiz/banks/test-bank.json --all
```
**Reporta:** ¿Puede leer la clave encriptada?

### Paso 5.2: Verificar IDs únicos (USUARIO)
**Ejecuta este comando:**
```
cat quiz/keys/test-bank.json | head -5
```
**Reporta:** ¿Genera IDs únicos?

### Paso 5.3: Verificar protección datos sensibles (AGENTE)
Yo verifico que NO se copian:
- quiz/keys/
- quiz/results/
- tutorials/keys/
- tutorials/sessions/

### Paso 5.4: Reinstalar (AGENTE)
Yo ejecuto install.

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 5.**

---

## Fase 6: Install & Update (/quiz-install-update)

### Paso 6.1: Dry-run (AGENTE)
```
node quiz/cli/install.js --dry-run --dir ../test-ai-test
```

### Paso 6.2: Crear archivo custom (USUARIO)
**Ejecuta este comando:**
```
echo '{"CUSTOM":true}' > ../test-ai-test/quiz/banks/custom-bank.json
```

### Paso 6.3: /quiz-install-update (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/install.js --dir ../test-ai-test
```
**Reporta:** ¿Se ejecutó sin errores?

### Paso 6.4: Verificar custom file (USUARIO)
**Ejecuta este comando:**
```
cat ../test-ai-test/quiz/banks/custom-bank.json
```
**Reporta:** ¿Todavía tiene {"CUSTOM":true}?

### Paso 6.5: Verificar system files (AGENTE)
Yo verifico con diff.

### Paso 6.6: Verificar ci-validate parchado (AGENTE)
```
grep "opencode" ../test-ai-test/.opencode/scripts/ci-validate.js | head -5
```

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 6.**

---

## Fase 7: Spanish Accents & Language (AGENTE)

Yo verifico automáticamente:
- Acentos en tutoriales
- Acentos en skills
- Campo language en tutoriales

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 7.**

---

## Fase 8: Commands Testing

### Paso 8.1: /quiz-register (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/manage-participants.js --add --id TEST-001 --name "Usuario Prueba"
```
**Reporta:** ¿Se registró en team.json?

### Paso 8.2: /quiz-migrate (USUARIO)
**Ejecuta estos comandos:**
```
echo '{"questions":[{"id":"q1","question":"Test","options":["A","B"],"answer":"A"}]}' > /tmp/legacy-bank.json
```
```
node quiz/cli/migrate-bank.js --input /tmp/legacy-bank.json --output quiz/banks/
```
**Reporta:** ¿Migró correctamente?

### Paso 8.3: /quiz-send dry-run (USUARIO)
**Ejecuta este comando:**
```
node quiz/cli/send-results.js --bank quiz/banks/test-bank.json --dry-run
```
**Reporta:** ¿Funciona sin enviar emails?

### Paso 8.4: /tutorial-report (AGENTE)
Yo verifico que el módulo carga.

### Paso 8.5: Reinstalar (AGENTE)
Yo ejecuto install después de todos los cambios.

---

**🔄 PAUSA: Revisar plan, ajustar según hallazgos de Fase 8.**

---

## Fase 9: Regresión y Limpieza

### Paso 9.1: Limpiar (USUARIO)
**Ejecuta este comando:**
```
rm quiz/banks/test-bank.json quiz/keys/test-bank.json tutorials/banks/test-tutorial.json tutorials/keys/test-tutorial.json /tmp/legacy-bank.json 2>/dev/null
```

### Paso 9.2: Limpiar participantes (USUARIO)
Eliminar TEST-001 de team.json.

### Paso 9.3: Documentar errores (AGENTE)
Yo actualizo la tabla de tracking.

### Paso 9.4: Crear tests regresión (AGENTE)
Para cada error encontrado.

### Paso 9.5: Tests finales (AGENTE)
```
node --test
```

### Paso 9.6: Reinstalar última vez (AGENTE)

### Paso 9.7: ci-validate final (AGENTE)

### Paso 9.8: Subir cambios (USUARIO)
**Ejecuta este comando:**
```
git add -A && git commit -m "fix: comprehensive testing fixes and regression tests" && git push
```

---

**🔄 PAUSA FINAL: Revisar todo el plan.**

## Verification
- [ ] Fase 1: Base validation
- [ ] Fase 2: Quiz bank & key
- [ ] Fase 3: Quiz execution
- [ ] Fase 4: Tutorial E2E
- [ ] Fase 5: Encryption & credentials
- [ ] Fase 6: Install & update
- [ ] Fase 7: Spanish accents
- [ ] Fase 8: Commands testing
- [ ] Fase 9: Regression tests
- [ ] All tests pass
- [ ] Changes pushed

## Error Tracking

| # | Fase | Error | Fix | Regression Test | Reinstall OK |
|---|------|-------|-----|-----------------|--------------|
| 1 | 2 | add-question.js no actualiza clave con --correct | Auto-crear/actualizar key en addQuestion() | 5 tests en create-bank.test.js | ✅ |

## Improvement Tracking

| # | Fase | Mejora | Archivo | Tests | Reinstall OK |
|---|------|--------|---------|-------|--------------|
| 1 | 2 | add-question auto-actualiza clave con --correct | quiz/cli/add-question.js | 5 tests nuevos | ✅ |

## Commands Reference

| Command | Tested | Notes |
|---------|--------|-------|
| `/test` | ✅ | 251 pass |
| `/plan` | | |
| `/quiz-create` | ✅ | Fase 2.1 |
| `/quiz-register` | | |
| `/quiz-practice` | | |
| `/quiz-run` | | |
| `/quiz-report` | | |
| `/quiz-send` | | |
| `/quiz-migrate` | | |
| `/quiz-install` | ✅ | Fase 1.3, 122 archivos |
| `/quiz-install-update` | | |
| `/survey` | | |
| `/tutorial` | | |
| `/tutorial-create` | | |
| `/tutorial-report` | | |
