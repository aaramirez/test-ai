---
name: m365
description: Read and search files in OneDrive and SharePoint via Microsoft Graph API.
license: MIT
---

# Microsoft 365 Skill

Accede a archivos en OneDrive y SharePoint, busca documentos, y lista sitios usando el MCP server de Microsoft 365.

## Setup

### Azure AD (one-time)

1. Ve a [Azure Portal](https://portal.azure.com) → App registrations
2. Crea una nueva registración con redirect URI `http://localhost`
3. Agrega permisos Microsoft Graph:
   - `Files.Read.All` — leer archivos OneDrive/SharePoint
   - `Sites.Read.All` — leer sitios SharePoint
   - `User.Read` — perfil de usuario
4. Genera un client secret
5. Configura las variables en `.env`:

```env
AZURE_CLIENT_ID=tu-client-id
AZURE_TENANT_ID=tu-tenant-id
AZURE_CLIENT_SECRET=tu-client-secret
```

### Habilitar MCP server

En `opencode.json`:

```json
"m365": {
  "command": ["npx", "-y", "@softeria/ms-365-mcp-server"],
  "enabled": true,
  "type": "local",
  "env": {
    "AZURE_CLIENT_ID": "{env:AZURE_CLIENT_ID}",
    "AZURE_TENANT_ID": "{env:AZURE_TENANT_ID}",
    "AZURE_CLIENT_SECRET": "{env:AZURE_CLIENT_SECRET}",
    "M365_READ_ONLY_MODE": "true"
  }
}
```

La primera vez, el server inicia un device-code flow para autenticar.

## Tools principales (archivos)

| Tool | Descripción |
|------|-------------|
| `graph_list_drive_children` | Listar archivos en un directorio de OneDrive |
| `graph_get_drive_item` | Obtener metadata de un archivo/carpeta |
| `graph_download_drive_item` | Descargar contenido de un archivo |
| `graph_search_drive` | Buscar archivos en OneDrive/SharePoint |
| `graph_list_sites` | Listar sitios de SharePoint |
| `graph_list_site_drives` | Listar document libraries de un sitio |
| `graph_list_site_children` | Listar archivos en una library |

Además cubre: Outlook, Teams, Calendar, Excel, OneNote.

## OneDrive vs SharePoint

- **OneDrive**: `graph_list_drive_children` con `driveId="me"` lista el drive personal
- **SharePoint**: usa `graph_list_sites` primero para encontrar el sitio, luego `graph_list_site_drives` para las libraries

## Ejemplos

```
→ "muéstrame los archivos en mi OneDrive"
→ "busca en SharePoint el documento 'reporte Q2'"
→ "descarga ese archivo y adjúntalo a un email"
→ "lista los sitios de SharePoint que tengo"
```

## Related

- [google-workspace](google-workspace) — acceso a Google Drive
- [email](email) — adjuntar archivos a emails
- [content-ingestion](content-ingestion) — estructurar contenido
