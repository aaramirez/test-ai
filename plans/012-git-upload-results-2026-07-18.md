# 012 — Subir resultados por git después de quiz/survey

## Objetivo

Preguntar al usuario si desea subir sus resultados por git (commit + push) después de completar un quiz, test o survey, y ejecutar la subida si confirma.

## Requisitos

1. Crear módulo compartido `quiz/lib/git-results.js` con funciones `gitAddCommit` y `gitPush` — prioridad: alta
2. Actualizar skill de survey para preguntar al usuario si desea subir resultados después de guardar — prioridad: alta
3. Actualizar skill de quiz para preguntar al usuario si desea subir resultados después de guardar — prioridad: alta
4. El commit message debe ser descriptivo: `chore(quiz): add results <bank> <session_id>` o `chore(survey): add results <bank> <session_id>` — prioridad: media
5. Push solo al branch `main` — prioridad: media
6. Si falla el push, mostrar error pero no bloquear — prioridad: media
7. No duplicar commits si el resultado ya fue commiteado — prioridad: baja
8. Cross-platform: usar `execFileSync` con array de args (no shell) — prioridad: alta

## Arquitectura

### Decisiones

- **Módulo compartido**: `quiz/lib/git-results.js` exporta `commitAndPushResult(filePath, mode)` que hace add → commit → push
- **Separación de responsabilidades**: El módulo solo ejecuta git, no decide cuándo preguntar. Los skills manejan la interacción con el usuario
- **No romper flujo actual**: Si git no está disponible o falla, el resultado ya está guardado localmente. Git es opcional
- **Reutilizar patrón existente**: `quiz/results.js` ya tiene `gitCommit()`. El nuevo módulo extiende ese patrón con push

### Archivos a crear

| Archivo | Descripción |
|---------|-------------|
| `quiz/lib/git-results.js` | Módulo con `commitAndPushResult(filePath, mode)` |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `.opencode/skills/survey/SKILL.md` | Agregar paso post-guardado: preguntar si subir por git |
| `.opencode/skills/quiz/SKILL.md` | Agregar paso post-guardado: preguntar si subir por git |

### Archivos sin cambios

| Archivo | Razón |
|---------|-------|
| `quiz/results.js` | Ya tiene su propio flujo de git, no interferir |
| `quiz/lib/session.js` | Lógica de guardado, sin cambios necesarios |
| `quiz/lib/survey-session.js` | Lógica de guardado, sin cambios necesarios |

## TDD Flow

1. **RED** — Escribir tests para `quiz/lib/git-results.js` que fallen (módulo no existe)
2. **GREEN** — Implementar `git-results.js` con `commitAndPushResult`
3. **REFACTOR** — Verificar que tests pasan

## Detalle de implementación

### 1. `quiz/lib/git-results.js`

```javascript
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Commits and pushes a result file via git.
 * @param {string} filePath - Absolute path to the result file
 * @param {string} mode - 'quiz' or 'survey' (used in commit message)
 * @returns {{ committed: boolean, pushed: boolean, error: string|null }}
 */
export function commitAndPushResult(filePath, mode) {
  if (!existsSync(filePath)) {
    return { committed: false, pushed: false, error: 'File not found' };
  }

  const filename = filePath.split('/').pop();
  const prefix = mode === 'survey' ? 'survey' : 'quiz';

  // git add
  try {
    execFileSync('git', ['add', filePath], { stdio: 'pipe' });
  } catch (err) {
    return { committed: false, pushed: false, error: `git add failed: ${err.message}` };
  }

  // git commit
  try {
    execFileSync('git', ['commit', '-m', `chore(${prefix}): add results ${filename}`], { stdio: 'pipe' });
  } catch (err) {
    // "nothing to commit" is not an error — file was already committed
    if (err.stderr?.toString().includes('nothing to commit')) {
      return { committed: false, pushed: false, error: null };
    }
    return { committed: false, pushed: false, error: `git commit failed: ${err.message}` };
  }

  // git push
  try {
    execFileSync('git', ['push', 'origin', 'main'], { stdio: 'pipe' });
    return { committed: true, pushed: true, error: null };
  } catch (err) {
    return { committed: true, pushed: false, error: `git push failed: ${err.message}` };
  }
}
```

### 2. Skill survey — paso adicional después de guardar

En `.opencode/skills/survey/SKILL.md`, después del paso 5 (Confirm), agregar:

```markdown
### 5b. Upload Results (Optional)

After confirming the survey is saved, ask the user:

> ¿Deseas subir tus resultados por git?

If yes, use the git-results module:

\`\`\`javascript
import { commitAndPushResult } from './quiz/lib/git-results.js';
const result = commitAndPushResult(sessionPath, 'survey');
\`\`\`

Report the result:
- committed + pushed: "Resultados subidos exitosamente."
- committed but push failed: "Commiteado localmente, pero falló el push: <error>"
- not committed (already committed): "Los resultados ya fueron commiteados."
- error: "No se pudieron subir los resultados: <error>"
```

### 3. Skill quiz — paso adicional después de guardar

En `.opencode/skills/quiz/SKILL.md`, después del paso de guardado, agregar:

```markdown
### Upload Results (Optional)

After confirming the quiz is saved, ask the user:

> ¿Deseas subir tus resultados por git?

If yes, use the git-results module:

\`\`\`javascript
import { commitAndPushResult } from './quiz/lib/git-results.js';
const result = commitAndPushResult(sessionPath, 'quiz');
\`\`\`

Report the result same as survey flow.
```

## Verificación

- [ ] Tests pasan (`node --test quiz/tests/*.test.js`)
- [ ] `git-results.js` exporta `commitAndPushResult`
- [ ] `commitAndPushResult` maneja: archivo no existe, commit exitoso, push exitoso, push falla, ya commiteado
- [ ] Skill survey documenta el paso de upload
- [ ] Skill quiz documenta el paso de upload
- [ ] Cross-platform: usa `execFileSync` con array (no shell)
