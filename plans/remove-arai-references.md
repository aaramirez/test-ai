# Remove arai References

## Objective

Remove all references to "arai" and "aramirez-ai" from the codebase, replacing with project-specific naming.

## Requirements

1. **Remove arai from AGENTS.md** — replace with opencode references, remove CLI commands — priority: high
2. **Remove plan-arai agent** — rename to "plan-docs" or merge into existing "plan" agent — priority: high
3. **Update opencode.json** — remove plan-arai agent definition — priority: high
4. **Update custom-logo.tsx** — remove arai branding from TUI logo — priority: medium
5. **Update ci-validate.js** — remove tutoriales-arai directory reference — priority: medium
6. **Update docgen/validate.js** — remove aramirez-ai from validation message — priority: low
7. **Keep plan document** — plans/fix-agents-md-testing-focus.md is historical, no changes needed — priority: low

## Architecture

### Files to Modify

| File | Change |
|------|--------|
| `AGENTS.md` | Remove arai references, remove CLI commands section, update descriptions |
| `opencode.json` | Remove plan-arai agent definition |
| `.opencode/agents/plan-arai.md` | Delete file (agent removed) |
| `.opencode/plugins/custom-logo.tsx` | Replace arai branding with project name |
| `.opencode/scripts/ci-validate.js` | Remove tutoriales-arai reference |
| `.opencode/scripts/docgen/validate.js` | Remove aramirez-ai from message |

### Files to Create

None.

### Decisions

1. **plan-arai agent removal** — there's already a "plan" agent; plan-arai is redundant. Remove it entirely.
2. **Logo update** — replace arai branding with "test-ia" project branding
3. **CLI commands removal** — arai CLI commands (init, install, uninstall, status, list) are external tool references; remove from AGENTS.md
4. **CI validation cleanup** — the tutoriales-arai directory doesn't exist; remove the reference

## TDD Flow

This is a documentation/config cleanup — no code logic changes. Verification is structural.

1. Search for remaining arai references after changes
2. Run CI validation
3. Verify agent table in AGENTS.md is consistent with opencode.json

## Verification

- [ ] `grep -r "arai" . --include="*.md" --include="*.json" --include="*.js" --include="*.tsx"` returns no results (except plans/)
- [ ] `node .opencode/scripts/ci-validate.js` passes
- [ ] opencode.json agent list matches AGENTS.md agent table
- [ ] No broken references to plan-arai agent
