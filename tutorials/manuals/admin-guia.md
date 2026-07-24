# Guia del Administrador de Tutoriales

## Configuracion Inicial (Una Vez)

### 1. Crear un Tutorial

```bash
node tutorials/cli/create-tutorial.js --name "Nombre del Tutorial" --id tutorial-id --difficulty easy
```

Opciones de dificultad: `easy`, `medium`, `hard`

### 2. Agregar Pasos

```bash
# Paso de contenido
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id intro --type content --title "Bienvenida" --body "Texto de introduccion"

# Paso de pregunta
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id q-001 --type question --question "Que es X?" \
  --options "Opcion A" "Opcion B" "Opcion C" --correct 1

# Punto de control (quiz de puerta)
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id cp-001 --type checkpoint --question "Punto de control?" \
  --options "A" "B" --correct 0 --min-score 1

# Escenario
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id sc-001 --type scenario --title "Decision" --narrative "Texto de la historia" \
  --options "Opcion A" "Opcion B"

# Ejercicio de codigo
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id code-001 --type code --title "Prueba" --code "echo hola" \
  --expected-output "hola"

# Desafio
node tutorials/cli/add-step.js --tutorial banks/tutorial-id.json \
  --id ch-001 --type challenge --title "Crear Archivo" \
  --instructions "Crea un archivo llamado test.txt"
```

### 3. Crear Clave de Respuestas

```bash
node tutorials/cli/create-key.js --bank banks/tutorial-id.json
```

### 4. Agregar Respuestas

```bash
node tutorials/cli/create-key.js --key keys/tutorial-id.json \
  --add q-001 --correct 1 --explanation "Correcto porque..."

node tutorials/cli/create-key.js --key keys/tutorial-id.json \
  --add cp-001 --correct 0 --explanation "Respuesta del punto de control"
```

### 5. Validar

```bash
node tutorials/cli/validate-tutorial.js banks/tutorial-id.json
node tutorials/cli/validate-tutorial.js --key keys/tutorial-id.json banks/tutorial-id.json
```

## Operaciones Diarias

### Antes de una Sesion de Tutorial
1. Verifica que el banco del tutorial este completo y validado
2. Verifica que la clave de respuestas exista y sea correcta
3. Revisa que tutorials/keys/ este en .gitignore

### Durante una Sesion de Tutorial
1. El participante ejecuta `/tutorial`
2. El agente presenta preguntas, rastrea XP y rachas
3. Las sesiones se guardan en tutorials/sessions/

### Despues de una Sesion de Tutorial
1. Ejecuta `/tutorial-report` para ver estadisticas de completado
2. Revisa el progreso y logros de los participantes
3. Revisa los puntos de control fallidos

## Ver Reportes

```bash
# Via comando
/tutorial-report

# Ver participante especifico
/tutorial-report --participant 100

# Ver tutorial especifico
/tutorial-report --tutorial tutorial-id
```

## Sistema de Gamificacion

### Valores de XP
| Accion | XP |
|--------|-----|
| Respuesta correcta | +10 |
| Ejercicio de codigo ejecutado | +5 |
| Desafio completado | +20 |
| Racha 3 | +5 bonus |
| Racha 5 | +10 bonus |
| Racha 10 | +25 bonus |

### Logros
| Logro | Condicion |
|-------|-----------|
| Primeros Pasos | Completa tu primer tutorial |
| Puntuacion Perfecta | Obtén 100% |
| En Llamas | Racha de 5+ |
| Corredor de Codigo | Ejecuta todos los ejercicios |
| Aprendiz Rapido | Completa en < 5 min |
| Explorador | Completa 3+ tutoriales |

## Referencia de Tipos de Pasos

| Tipo | Necesita Clave | Puntuacion | Ramificacion |
|------|---------------|------------|--------------|
| `contenido` | No | No | No |
| `pregunta` | Si | Si | No |
| `opcion` | No | No | Si |
| `codigo` | No | No | No |
| `desafio` | No | No | No |
| `escenario` | Embebida | Si | Si |
| `punto de control` | Si | Si | No |

## Ubicacion de Archivos

| Ruta | Proposito | Commiteado |
|------|-----------|------------|
| `tutorials/banks/` | Contenido del tutorial | Si |
| `tutorials/keys/` | Claves de respuestas | No (gitignored) |
| `tutorials/sessions/` | Resultados de sesiones | Si |
| `tutorials/registry.json` | Seguimiento de completado | Si |

## Solucion de Problemas

### "Banco no encontrado"
- Verifica que el archivo del banco exista en `tutorials/banks/`
- Revisa que el nombre coincida exactamente (distingue mayusculas)

### "La clave ya existe"
- Elimina la clave existente o usa un nombre diferente
- Las claves estan en `tutorials/keys/`

### Punto de control no pasa
- El participante debe obtener al menos `min_score` para continuar
- Revisa la configuracion del paso de punto de control en el banco

### XP no se rastrea
- Verifica que `tutorials/registry.json` exista y sea escribible
- Revisa que el ID del participante sea consistente entre sesiones

## Relacionado

- [Guia del Participante](participante.md) — Como tomar tutoriales
- [Referencia Rapida](referencia-rapida.md) — Todos los comandos de tutoriales
