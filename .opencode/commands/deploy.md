---
description: Deploy the current project.
---

Detect the project type and deployment method:
- Node.js: check for `Dockerfile`, `deploy.yaml`, `fly.toml`, `vercel.json`
- Python: check for `Dockerfile`, `deploy.yaml`, `serverless.yml`
- General: check for `Dockerfile`, `Makefile` with deploy target

Run the deploy command or provide step-by-step instructions if automated deploy isn't configured.
