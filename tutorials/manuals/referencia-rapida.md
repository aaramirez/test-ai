# Referencia Rapida de Tutoriales

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `/tutorial` | Ejecutar un tutorial interactivo |
| `/tutorial-create` | Crear un nuevo tutorial |
| `/tutorial-report` | Ver reportes de completado |
| `/tutorial-key` | Gestionar claves de respuestas |

## Scripts CLI

### Crear Tutorial
```bash
node tutorials/cli/create-tutorial.js --name "Nombre" --id id --difficulty easy
```

### Agregar Paso
```bash
node tutorials/cli/add-step.js --tutorial banks/id.json \
  --id step-001 --type content --title "T" --body "B"
```

### Validar
```bash
node tutorials/cli/validate-tutorial.js banks/id.json
node tutorials/cli/validate-tutorial.js --key keys/id.json banks/id.json
```

### Crear Clave
```bash
node tutorials/cli/create-key.js --bank banks/id.json
node tutorials/cli/create-key.js --key keys/id.json --add q-001 --correct 1
node tutorials/cli/create-key.js --list
```

## Tipos de Pasos

| Tipo | Clave | Puntuacion | Ramificacion |
|------|-------|------------|--------------|
| `contenido` | No | No | No |
| `pregunta` | Si | Si | No |
| `opcion` | No | No | Si |
| `codigo` | No | No | No |
| `desafio` | No | No | No |
| `escenario` | Embebida | Si | Si |
| `punto de control` | Si | Si | No |

## Sistema de XP

| Accion | XP |
|--------|-----|
| Respuesta correcta | +10 |
| Codigo ejecutado | +5 |
| Desafio | +20 |
| Racha 3 | +5 |
| Racha 5 | +10 |
| Racha 10 | +25 |

## Ubicacion de Archivos

| Ruta | Proposito | Commiteado |
|------|-----------|------------|
| `tutorials/banks/` | Contenido | Si |
| `tutorials/keys/` | Claves | No |
| `tutorials/sessions/` | Sesiones | Si |
| `tutorials/registry.json` | Progreso | Si |

## Formato de ID de Sesion

Prefijo: `t-` para sesiones de tutorial.

## Relacionado

- [Guia del Participante](participante.md) |
- [Guia del Administrador](admin-guia.md)
