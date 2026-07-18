# Install — Protect User Data From Overwrite

## Objective

The installer (`quiz/cli/install.js`) must never overwrite user data files (participants, results, keys, banks, survey data, visibility config, repos.json) during install or update.

## Requirements

1. **`quiz/participants.json`** — participant registry, never overwritten. — priority: high
2. **`quiz/results/`** — all quiz session results and index, never overwritten. — priority: high
3. **`quiz/keys/`** — encrypted answer keys (gitignored, may exist), never overwritten. — priority: high
4. **`quiz/banks/`** — user-created question banks, never overwritten. — priority: high
5. **`quiz/bank.json`** — legacy unmigrated bank, never overwritten. — priority: medium
6. **`surveys/registry.json`** — survey participation tracking, never overwritten. — priority: high
7. **`surveys/_index.json`** — survey session index, never overwritten. — priority: high
8. **`surveys/visibility.json`** — survey visibility config, never overwritten. — priority: high
9. **`surveys/results/`** — all survey result files, never overwritten. — priority: high
10. **`repos.json`** — reference repository config, never overwritten. — priority: medium
11. **Backward compatibility** — existing install tests continue to pass; the installer still copies all system files (quiz cli/lib/tests/manuals, `.opencode/` skills/commands/scripts). — priority: high
12. **`--dry-run` reflects excluded files** — user data files should be listed as "skipped" in verbose mode so the user knows they are preserved. — priority: low
13. **`--force` flag** — optional flag to override protection (copy everything, overwrite user data), default `false`. — priority: low

## Architecture

### Decision: `shouldInclude` vs `shouldProtect`

The current `shouldInclude(relPath)` returns `true`/`false` for whether a file should be **copied at all**. User data files are currently included but **should not be copied from source to target**.

**Approach:** Add a separate `PROTECTED_PATHS` Set. In the `install()` function, after listing files, filter out any file whose relative path matches a protected prefix. The `getFileList()` will still list them (for dry-run transparency), but `install()` will skip them.

This means:
- `getFileList()` unchanged — still returns all files (tests can verify visibility)
- `install()` skips protected files during copy
- Protected files already present in target are never touched
- Protected files not present in target are simply not created (user must create them manually or they get created by the quiz/system at runtime)

### Files to Protect

```javascript
const PROTECTED_PREFIXES = [
  'quiz/participants.json',
  'quiz/results/',
  'quiz/keys/',
  'quiz/banks/',
  'quiz/bank.json',
  'surveys/registry.json',
  'surveys/_index.json',
  'surveys/visibility.json',
  'surveys/results/',
  'repos.json',
];
```

Protected paths are matched by prefix (same as `EXCLUDE_PREFIXES`). Any file whose relative path starts with any of these strings is skipped during copy.

### What about `.gitkeep` files?

`surveys/results/.gitkeep` is under `surveys/results/` and would be protected. This is fine — the `ensureSurveyDirs()` function in `survey-session.js` creates the directories at runtime if they don't exist, so `.gitkeep` is unnecessary in the installed copy. The source `.gitkeep` only exists to keep the empty directory in git.

### What about default bank files?

The built-in banks (`quiz/banks/javascript.json`, `python.json`, `bash.json`, `git.json`, `feedback-survey.json`) are currently shipped as system files. But users may modify them. **Decision:** All banks are user data. Users who want default banks should copy them manually or the installer could offer a `--include-banks` flag. This avoids the risk of overwriting customized banks.

### What about `quiz/tests/test-register-*.json`?

These are test artifacts, not user data. They happen to be under `quiz/tests/` which is a system directory. They will still be copied. No action needed.

### Dry-run output

In verbose dry-run mode, protected files should be shown with a `[protected]` annotation so the user knows they are preserved.

### `--force` flag (optional)

If provided, protection is bypassed and all files from source are copied to target, overwriting any existing user data. Default: `false`.

## TDD Flow

### Red (write failing tests)

Add to `quiz/tests/install.test.js`:

1. `install` does NOT overwrite `quiz/participants.json` when it exists in target
2. `install` does NOT overwrite `quiz/results/` files when they exist in target
3. `install` does NOT overwrite `quiz/keys/` files when they exist in target
4. `install` does NOT overwrite `quiz/banks/` files when they exist in target
5. `install` does NOT overwrite `surveys/registry.json` when it exists in target
6. `install` does NOT overwrite `surveys/visibility.json` when it exists in target
7. `install` does NOT overwrite `surveys/results/` files when they exist in target
8. `install` does NOT overwrite `repos.json` when it exists in target
9. `install` still copies system files (quiz CLI, lib, .opencode/)
10. `install --force` overwrites protected files
11. Dry-run verbose shows `[protected]` annotations

### Green (implement)

1. Add `PROTECTED_PREFIXES` constant to `install.js`
2. Add `isProtected(relPath)` helper function
3. Modify `install()` to filter out protected files during copy (skip them)
4. Add `--force` flag parsing to override protection
5. Update dry-run verbose output to show `[protected]` marker
6. Update tests

### Refactor

- Verify edge cases: file paths with mixed slashes, subdirectories within protected dirs, empty protected directories

## Verification

- [ ] `node --test` — all tests pass (original + new protection tests)
- [ ] `node .opencode/scripts/ci-validate.js` — CI validation passes
- [ ] `node quiz/cli/install.js --dry-run --verbose` shows protected files
- [ ] `node quiz/cli/install.js --dry-run --verbose --force` does NOT show protected annotation
- [ ] Actual install to temp dir: protected files in target are preserved, system files are updated
- [ ] AGENTS.md and README updated if needed
