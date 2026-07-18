---
name: google-workspace
description: Read and search files in Google Drive, Docs, and Sheets via Google's official MCP server.
license: MIT
---

# Google Workspace Skill

Accede a archivos de Google Drive, lee Google Docs y Google Sheets usando el MCP server oficial de Google.

## Setup

### OAuth (one-time)

Opción A (automática):

```bash
npx -y @google/mcp-workspace auth
```

Esto abre el browser para el flujo OAuth. Las credenciales se guardan automáticamente.

Opción B (manual):

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/projectcreate)
2. Habilita Google Drive API y Google Docs API
3. Configura pantalla de consentimiento OAuth
4. Crea un OAuth Client ID (tipo "Desktop App")
5. Descarga el JSON con las credenciales

### Habilitar MCP server

En `opencode.json`:

```json
"google-workspace": {
  "command": ["npx", "-y", "@google/mcp-workspace"],
  "enabled": true,
  "type": "local"
}
```

## Tools principales

| Tool | Descripción |
|------|-------------|
| `drive_files_list` | Listar archivos en Google Drive |
| `drive_files_get` | Obtener metadata de un archivo |
| `drive_files_export` | Exportar contenido (Docs → MD, Sheets → CSV) |
| `drive_files_search` | Buscar archivos por query |
| `docs_documents_get` | Leer contenido de un Google Doc |
| `sheets_values_get` | Leer celdas de un Google Sheet |

## Ejemplos

```
→ "búscame el documento 'plan estratégico' en Google Drive"
→ "léeme el Google Doc con ID abc123"
→ "muéstrame los archivos en mi Drive"
→ "exporta ese Google Sheet a CSV"
```

## Integración

Usa este skill con `email` para adjuntar archivos, o con `content-ingestion` para estructurar contenido leído.

## Related

- [email](email) — adjuntar archivos a emails
- [content-ingestion](content-ingestion) — estructurar contenido
- [m365](m365) — acceso a SharePoint/OneDrive
