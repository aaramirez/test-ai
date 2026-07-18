---
description: Update an existing quiz/testing installation. Usage: /quiz-install-update <target-dir>
---

The installed path is: $ARGUMENTS. If not provided, ask the user for the path.
Run `node quiz/cli/install.js --dir <path>` to re-copy all files from the source
project (this repository) to the target, overwriting any existing files.
Report the number of files updated. No dry-run needed — the user already has
an installation and just wants the latest versions.
