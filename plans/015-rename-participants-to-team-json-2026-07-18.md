# Rename participants.json to team.json and exclude repos.json from install

## Objective
Move participant registry from `quiz/participants.json` to `team.json` at project root, add `id.json` for quick ID lookup, and exclude `repos.json` from installation copy.

## Requirements
1. Delete `quiz/participants.json`彻底 — priority: high
2. Create `team.json` at project root — priority: high
3. Create `id.json` at project root for quick ID lookup — priority: high
4. Update identification flow: check `id.json` first, if not found ask and save to `team.json` + `id.json` — priority: high
5. Exclude `repos.json` from installation copy — priority: high
6. Update `install.js` protection list — priority: high
7. Update all references in skills, docs, tests — priority: high

## Architecture

### Identification Flow
```
1. Ask: ¿Cuál es tu cédula?
2. Check id.json for that cédula
3. If found → use stored name/email, resolve groups from team.json
4. If not found → ask name/email, save to team.json, save ID mapping to id.json
```

### File Structure
```
project-root/
├── id.json          # Quick ID lookup: { "12345": { "name": "...", "email": "..." } }
├── team.json        # Full registry: { "participants": {...}, "groups": {...} }
└── ...
```

### id.json Format
```json
{
  "12345": {
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

### team.json Format
```json
{
  "participants": {
    "12345": {
      "id": "12345",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "metadata": { "group": "cohorte-A" }
    }
  },
  "groups": {
    "cohorte-A": ["12345"]
  }
}
```

### Files to Modify

| File | Change |
|------|--------|
| `quiz/lib/participant.js` | Add `loadIdRegistry()`, `saveIdRegistry()`, update path to `team.json` at root |
| `quiz/cli/install.js` | Add `repos.json` to EXCLUDE_PREFIXES, add `id.json` to PROTECTED_PREFIXES, remove `quiz/participants.json` from PROTECTED_PREFIXES |
| `.opencode/skills/survey/SKILL.md` | Update flow: check `id.json` first |
| `.opencode/skills/quiz/SKILL.md` | Update flow: check `id.json` first |
| `AGENTS.md` | Update path references |
| `README.md` | Update path references |
| `quiz/tests/install-protection.test.js` | Update tests |
| `quiz/tests/install.test.js` | Update tests |

### Files to Delete
- `quiz/participants.json` —彻底 eliminar, no debe existir

### Path Resolution Logic
```javascript
// participant.js
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

const TEAM_PATH = process.env.TEAM_PATH || join(PROJECT_ROOT, 'team.json');
const ID_PATH = process.env.ID_PATH || join(PROJECT_ROOT, 'id.json');

function loadIdRegistry() {
  if (!existsSync(ID_PATH)) return {};
  return JSON.parse(readFileSync(ID_PATH, 'utf-8'));
}

function saveIdRegistry(registry) {
  writeFileSync(ID_PATH, JSON.stringify(registry, null, 2));
}

export function findById(cedula) {
  const ids = loadIdRegistry();
  return ids[cedula] || null;
}

export function registerParticipant({ id, name, email, metadata }) {
  // Save to team.json (full registry)
  // Also save to id.json (quick lookup)
}
```

## TDD Flow

### 1. Write Tests → FAIL
Create failing tests for:
- `team.json` path resolution
- `id.json` path resolution
- `findById()` function
- `repos.json` exclusion from file list
- Install does not copy `repos.json`

### 2. Implement → PASS
- Update `participant.js` with new paths and functions
- Update `install.js` exclusions
- Update all references

### 3. Refactor → still PASS
- Clean up code
- Verify all tests pass

## Verification
- [ ] All 146+ tests pass
- [ ] `quiz/participants.json` does NOT exist
- [ ] Install to fresh directory creates no `repos.json`
- [ ] Install to fresh directory creates no `quiz/participants.json`
- [ ] Participant identification uses `id.json` for lookup
- [ ] New participants saved to both `team.json` and `id.json`
