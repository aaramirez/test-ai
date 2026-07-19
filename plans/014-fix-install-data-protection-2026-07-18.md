# Fix Install/Update Data Protection

## Objective
Fix install.js to never copy or overwrite user data files (results, banks, participants, registry, index) during install or update operations.

## Requirements
1. Never copy results directories from source — priority: high
2. Never copy banks directories from source — priority: high
3. Never overwrite participants.json — priority: high
4. Never overwrite surveys/registry.json — priority: high
5. Never overwrite surveys/_index.json — priority: high
6. Never overwrite quiz/results/_index.json — priority: high
7. Never overwrite surveys/visibility.json — priority: high
8. Never overwrite repos.json — priority: high
9. Never overwrite quiz/keys/ — priority: high
10. Add proper directory exclusion for results and banks — priority: high
11. Update documentation — priority: medium
12. Add tests for protection logic — priority: medium

## Architecture

### Problem Analysis
The current install.js has two issues:
1. **PROTECTED_PREFIXES** only prevents overwriting existing files, but still copies from source
2. **walkDir** traverses results and banks directories, adding their files to the copy list

### Solution
1. Add results and banks directories to **EXCLUDE_PREFIXES** so they're never traversed
2. Keep PROTECTED_PREFIXES for safety (in case someone adds files to source)
3. Never copy user data directories from source

### Files to Modify
- `quiz/cli/install.js` — fix exclusion logic

### Files to Create
- `quiz/tests/install-protection.test.js` — tests for protection logic

## Changes to install.js

### EXCLUDE_PREFIXES (add these)
```javascript
const EXCLUDE_PREFIXES = [
  // ... existing entries ...
  'quiz/results/',      // Never copy results from source
  'quiz/banks/',        // Never copy banks from source
  'surveys/results/',   // Never copy survey results from source
  'surveys/banks/',     // Never copy survey banks from source
];
```

### PROTECTED_PREFIXES (keep as safety net)
```javascript
const PROTECTED_PREFIXES = [
  'quiz/participants.json',
  'quiz/results/',        // Keep as safety
  'quiz/keys/',
  'quiz/banks/',          // Keep as safety
  'quiz/bank.json',
  'surveys/registry.json',
  'surveys/_index.json',
  'surveys/visibility.json',
  'surveys/results/',     // Keep as safety
  'surveys/banks/',       // Keep as safety
  'repos.json',
];
```

## TDD Flow

### 1. Write Tests → FAIL
Create `quiz/tests/install-protection.test.js`:
- Test that results directories are excluded from file list
- Test that banks directories are excluded from file list
- Test that participants.json is protected
- Test that registry.json is protected
- Test that _index.json is protected

### 2. Implement → PASS
Update install.js with proper exclusions

### 3. Refactor → still PASS
Clean up code while maintaining behavior

## Verification
- [ ] Run existing install tests
- [ ] Run new protection tests
- [ ] Test fresh install to new directory
- [ ] Test update to existing directory
- [ ] Verify no results/banks copied from source
- [ ] Verify existing user data preserved
