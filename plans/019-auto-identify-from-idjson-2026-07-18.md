# Auto-identify Participant from id.json

## Objective
Skip the identification question in quiz and survey workflows when `id.json` exists and contains exactly one participant — use that identity automatically.

## Requirements
1. If `id.json` exists and has an entry, auto-use that participant without asking for cédula — priority: high
2. If `id.json` does not exist or is empty, fall back to current flow (ask for cédula, then register) — priority: high
3. Update survey skill instructions accordingly — priority: high
4. Update quiz skill instructions accordingly — priority: high

## Architecture

### No code changes — skill instructions only

The `participant.js` module already has all the needed primitives:
- `findById(cedula)` — lookup in `id.json` (already exists)
- `findParticipant(id)` — lookup in `team.json` (already exists)
- `registerParticipant({id, name, email})` — register new (already exists)

No new code needed. The agent just needs to check if `id.json` exists and has entries.

### Files to modify
| File | Change |
|------|--------|
| `.opencode/skills/survey/SKILL.md` | Replace step 1 with auto-identify flow |
| `.opencode/skills/quiz/SKILL.md` | Replace step 1 with auto-identify flow |

### New Step 1 flow (both skills)

```
1. Load id.json with findById() — check if any entry exists
   - If id.json has entries → auto-use the first (and only) entry:
     "Bienvenido {name}! Usando tu registro existente."
     Then look up full profile with findParticipant(id).
   - If id.json is empty or missing → current flow (ask cédula, register)
```

Implementation: call `findById(someId)` is not useful here since we don't know the id. Instead, the agent should:
1. Try to `import { existsSync } from 'fs'` and check if the file exists
2. Or simpler: just import and call a check. The `findById` approach requires knowing the key.

Better approach — use a simple inline check that the agent can do:

```javascript
import { readFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..', '..'); // relative to skill

const idPath = join(PROJECT_ROOT, 'id.json');
if (existsSync(idPath)) {
  const ids = JSON.parse(readFileSync(idPath, 'utf-8'));
  const entries = Object.entries(ids);
  if (entries.length > 0) {
    const [id, data] = entries[0];
    const participant = findParticipant(id); // full profile from team.json
    // auto-use participant
  }
}
```

Or simpler — the agent can use `listRegisteredIds()` from participant.js:

Let's add a minimal helper to participant.js that the agent can call.

### New participant.js export

```js
export function hasRegisteredId() {
  const ids = loadIdRegistry();
  const entries = Object.keys(ids);
  if (entries.length === 0) return null;
  const id = entries[0];
  return { id, ...ids[id] };
}
```

### Files to modify
| File | Change |
|------|--------|
| `quiz/lib/participant.js` | Add `hasRegisteredId()` export |
| `quiz/tests/participant.test.js` | Add tests for `hasRegisteredId()` |
| `.opencode/skills/survey/SKILL.md` | Replace step 1 with auto-identify flow |
| `.opencode/skills/quiz/SKILL.md` | Replace step 1 with auto-identify flow |

## TDD Flow
1. Write test for `hasRegisteredId()` — FAIL (not yet implemented)
2. Implement `hasRegisteredId()` in `participant.js` — PASS
3. Update skill instructions

## Verification
- [ ] `hasRegisteredId()` tests pass
- [ ] All existing 167+ tests pass
- [ ] Survey: if id.json has entry, agent auto-uses it
- [ ] Quiz: if id.json has entry, agent auto-uses it
- [ ] Survey: if no id.json, agent asks for cédula
- [ ] Quiz: if no id.json, agent asks for cédula
