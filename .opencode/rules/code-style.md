# Code style rules

## General
- Follow the project's existing patterns
- No commented-out code — delete it
- Keep functions small and focused (single responsibility)
- Use meaningful names; avoid abbreviations
- Prefer immutability where practical

## TypeScript / JavaScript
- Use TypeScript strict mode
- Prefer `const` over `let`; never use `var`
- Use arrow functions for callbacks
- Named exports over default exports

## Python
- Follow PEP 8
- Use type hints for all public functions
- Prefer pathlib over os.path

## Git
- Atomic commits (one logical change per commit)
- Conventional commit messages
- Rebase before merging to main
