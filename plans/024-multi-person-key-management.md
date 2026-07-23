# Plan: Multi-Person Key Management

## Objetivo
Permitir que múltiples miembros del equipo puedan cifrar y descifrar claves de respuestas, con control de acceso selectivo por ID y grupo, protegido con cifrado admin, previniendo suplantación de identidad.

## Problema Actual
- 1 clave age por persona
- No hay forma de compartir claves públicas
- No hay control de acceso selectivo
- No hay verificación de identidad
- Las claves cifradas no se pueden commitear para que otros revisen

## Arquitectura Propuesta

### Estructura de Archivos

```
quiz/keys/
├── team-public.json      ← Claves públicas (committeado, legible)
├── access.json.enc       ← Control de acceso cifrado (committeado, NO legible)
├── approvals.json.enc    ← Aprobaciones pendientes (committeado, cifrado)
├── test-bank.json        ← Clave de respuestas cifrada (gitignored)
└── examen-final.json     ← Clave de respuestas cifrada (gitignored)
```

### Archivos Nuevos

#### 1. `quiz/keys/team-public.json` — Claves públicas (committeado)
```json
{
  "10488134": {
    "publicKey": "age1abc...",
    "uploaded_at": "2026-07-22T00:00:00Z",
    "approved_by": "10488100",
    "approved_at": "2026-07-22T01:00:00Z",
    "status": "active"
  },
  "10488135": {
    "publicKey": "age1def...",
    "uploaded_at": "2026-07-22T00:00:00Z",
    "approved_by": null,
    "approved_at": null,
    "status": "pending"
  }
}
```
- IDs de `team.json`
- Estado: `pending` (esperando aprobación) o `active` (aprobado)
- `approved_by`: ID del admin que aprobó
- Solo claves con `status: active` pueden usarse para cifrar/descifrar

#### 2. `quiz/keys/access.json.enc` — Control de acceso cifrado (committeado)
```json
{
  "quiz/keys/test-bank.json": {
    "read": ["quiz-admin", "evaluadores"],
    "write": ["10488134"]
  },
  "quiz/keys/examen-final.json": {
    "read": ["quiz-admin"],
    "write": ["10488134", "10488135"]
  }
}
```
- `read`: Array de IDs o grupos con acceso de lectura
- `write`: Array de IDs o grupos con acceso de escritura
- Soporta múltiples grupos por permiso
- **Cifrado con clave admin** — solo admins pueden leer/modificar

#### 3. `quiz/keys/approvals.json.enc` — Aprobaciones pendientes (committeado, cifrado)
```json
{
  "pending": [
    {
      "id": "10488135",
      "publicKey": "age1def...",
      "uploaded_at": "2026-07-22T00:00:00Z",
      "reason": "Evaluador de exámenes"
    }
  ],
  "approved": [],
  "rejected": []
}
```
- Solo admins pueden ver y procesar
- Registro de todas las solicitudes

### Scripts Nuevos/Modificados

#### `manage-keys.js` — Gestión de claves y acceso

```bash
# === OPERACIONES DE MIEMBRO (self-service) ===

# Miembro sube su clave pública (queda pendiente)
node quiz/cli/manage-keys.js --upload-key --id 10488134 --reason "Evaluador"

# Miembro verifica estado de su clave
node quiz/cli/manage-keys.js --my-key --id 10488134


# === OPERACIONES DE ADMIN (requieren SOPS_ADMIN_AGE_KEY) ===

# Admin aprueba solicitud
node quiz/cli/manage-keys.js --approve --id 10488135

# Admin rechaza solicitud
node quiz/cli/manage-keys.js --reject --id 10488136 --reason "No autorizado"

# Admin asigna acceso (read/write) — soporta múltiples grupos
node quiz/cli/manage-keys.js --grant \
  --key quiz/keys/test-bank.json \
  --read quiz-admin,evaluadores \
  --write 10488134

# Admin revoca acceso
node quiz/cli/manage-keys.js --revoke \
  --key quiz/keys/test-bank.json \
  --read evaluadores

# Admin lista accesos (descifra access.json.enc)
node quiz/cli/manage-keys.js --list-access

# Admin lista solicitudes pendientes
node quiz/cli/manage-keys.js --list-pending

# Admin verifica quién puede acceder
node quiz/cli/manage-keys.js --who-access quiz/keys/test-bank.json


# === OPERACIONES DE VERIFICACIÓN (no requieren admin) ===

# Verificar si puedo acceder a una clave
node quiz/cli/manage-keys.js --can-access quiz/keys/test-bank.json --id 10488134
```

#### `encrypt-key.js` — Cifrado multi-persona (modificado)

```bash
# Cifra para todos los IDs en "read" del access.json
node quiz/cli/encrypt-key.js quiz/keys/test-bank.json

# El script:
# 1. Descifra access.json.enc con clave admin
# 2. Lee quién tiene "read" para esta clave
# 3. Resuelve grupos contra team.json
# 4. Filtra solo miembros con status "active" en team-public.json
# 5. Busca las claves públicas en team-public.json
# 6. Cifra con sops --age para todos los IDs autorizados
```

### Prevención de Suplantación de Identidad

#### Capa 1: Aprobación de Claves Públicas
```
PROBLEMA: Alguien se hace pasar por 10488134 y sube su clave pública
SOLUCIÓN: Toda clave pública requiere aprobación de admin

FLUJO:
1. Usuario ejecuta: --upload-key --id 10488134
2. Clave queda en estado "pending" en team-public.json
3. Admin ve la solicitud: --list-pending
4. Admin aprueba: --approve --id 10488134
5. Clave pasa a estado "active"
6. Solo claves "active" se usan para cifrar/descifrar
```

#### Capa 2: Verificación de Identidad (Opcional)
```
PROBLEMA: Admin no conoce al nuevo miembro en persona
SOLUCIÓN: Challenge-response

FLUJO:
1. Admin ejecuta: --challenge --id 10488134
2. Sistema genera código aleatorio
3. Admin envía el código al miembro por canal seguro (email, presencial)
4. Miembro ejecuta: --respond --id 10488134 --code ABC123
5. Si el código es correcto, la clave se aprueba
```

#### Capa 3: Auditoría
```
PROBLEMA: No hay registro de quién hizo qué
SOLUCIÓN: Log de operaciones

CADA OPERACIÓN REGISTRA:
- Timestamp
- ID del usuario
- Operación realizada
- Resultado (éxito/fallo)
- IP (opcional)
```

### Manejo de Grupos Múltiples

Los grupos se resuelven contra `team.json`:

```json
// team.json
{
  "participants": {
    "10488134": { "id": "10488134", "name": "Prof A" },
    "10488135": { "id": "10488135", "name": "Prof B" },
    "10488136": { "id": "10488136", "name": "Prof C" }
  },
  "groups": {
    "quiz-admin": ["10488134", "10488135"],
    "evaluadores": ["10488134", "10488136"],
    "tutores": ["10488135", "10488136"]
  }
}
```

Cuando `access.json` tiene múltiples grupos:
```json
{
  "quiz/keys/test-bank.json": {
    "read": ["quiz-admin", "evaluadores"],
    "write": ["10488134"]
  }
}
```

El script resuelve:
- `quiz-admin` → ["10488134", "10488135"]
- `evaluadores` → ["10488134", "10488136"]
- Unión: ["10488134", "10488135", "10488136"]
- `write` → ["10488134"]
- Se cifra para: 10488134, 10488135, 10488136

---

## Filosofía TDD

Cada componente se implementa siguiendo TDD:

```
RED    → Escribir test que falla
GREEN  → Implementar mínimo para pasar
REFACTOR → Limpiar código manteniendo tests verdes
```

### Orden de Implementación

```
FASE A: Core Infrastructure
1. Tests para team-public.json (upload, approve, status)
2. Implementar upload-key, approve
3. Tests para access.json.enc (grant, revoke, resolve groups)
4. Implementar grant, revoke, resolve

FASE B: Encryption
5. Tests para encrypt-key multi-person
6. Implementar encrypt-key multi-person
7. Tests para cifrar con grupos múltiples

FASE C: Lifecycle
8. Tests para proceso nuevo miembro
9. Tests para proceso miembro saliente
10. Tests para revocación de acceso

FASE D: Integration
11. Tests de integración completos
12. Instalación y verificación en ../test-ai-test
```

---

## Procesos de Ciclo de Vida

### 1. Nuevo Miembro se Une

**Responsable:** Admin + Miembro nuevo

**Pasos (con TDD):**
```
MIEMBRO NUEVO:
1. Genera su clave age:
   age-keygen -o ~/.config/sops/age/keys.txt

2. Sube su clave pública (queda pendiente):
   node quiz/cli/manage-keys.js --upload-key --id 10488136 --reason "Evaluador"

ADMIN:
3. Ve la solicitud:
   node quiz/cli/manage-keys.js --list-pending

4. Aprueba:
   node quiz/cli/manage-keys.js --approve --id 10488136

5. Registra en team.json:
   node quiz/cli/manage-participants.js --add --id 10488136 --name "Prof C"

6. Asigna al grupo:
   node quiz/cli/manage-participants.js --group evaluadores --add 10488136

7. Asigna acceso:
   node quiz/cli/manage-keys.js --grant \
     --key quiz/keys/test-bank.json \
     --read evaluadores

8. Re-cifra:
   node quiz/cli/encrypt-key.js quiz/keys/test-bank.json
```

**Verificación:**
- Nuevo miembro puede descifrar: `sops -d quiz/keys/test-bank.json`
- Si funciona → acceso correcto

---

### 2. Miembro Se Va

**Responsable:** Admin

**Pasos:**
```
ADMIN:
1. Identificar claves afectadas:
   node quiz/cli/manage-keys.js --who-access-for 10488134

2. Revocar acceso de cada clave:
   node quiz/cli/manage-keys.js --revoke \
     --key quiz/keys/test-bank.json \
     --read 10488134
   
   node quiz/cli/manage-keys.js --revoke \
     --key quiz/keys/examen-final.json \
     --read 10488134

3. Re-cifrar cada clave:
   node quiz/cli/encrypt-key.js quiz/keys/test-bank.json
   node quiz/cli/encrypt-key.js quiz/keys/examen-final.json

4. Eliminar clave pública:
   node quiz/cli/manage-keys.js --remove-key --id 10488134

5. Eliminar de team.json:
   node quiz/cli/manage-participants.js --remove 10488134

6. Eliminar de grupos:
   node quiz/cli/manage-participants.js --group evaluadores --remove 10488134
```

**Verificación:**
- Miembro saliente ya NO puede descifrar
- Demás miembros siguen pudiendo descifrar

---

### 3. Revocar Acceso a una Clave Específica

**Responsable:** Admin

**Pasos:**
```
ADMIN:
1. Revocar acceso:
   node quiz/cli/manage-keys.js --revoke \
     --key quiz/keys/test-bank.json \
     --read 10488135

2. Re-cifrar:
   node quiz/cli/encrypt-key.js quiz/keys/test-bank.json

3. Verificar:
   node quiz/cli/manage-keys.js --can-access quiz/keys/test-bank.json --id 10488135
   # Debe retornar: false
```

---

### 4. Rotar Clave de Contenido (Seguridad Máxima)

**Responsable:** Admin

**Cuándo:** Miembro con acceso sensible se va, o política de seguridad

**Pasos:**
```
ADMIN:
1. Crear nueva clave:
   node quiz/cli/create-key.js --bank quiz/banks/examen.json

2. Copiar respuestas:
   node quiz/cli/manage-keys.js --copy-answers \
     --from quiz/keys/examen-viejo.json \
     --to quiz/keys/examen-nuevo.json

3. Asignar nuevos permisos:
   node quiz/cli/manage-keys.js --grant \
     --key quiz/keys/examen-nuevo.json \
     --read quiz-admin,evaluadores \
     --write 10488134

4. Cifrar nueva clave:
   node quiz/cli/encrypt-key.js quiz/keys/examen-nuevo.json

5. Eliminar clave vieja:
   rm quiz/keys/examen-viejo.json
   node quiz/cli/manage-keys.js --remove-access --key quiz/keys/examen-viejo.json
```

---

## Flujo Completo

```
SETUP INICIAL:
1. Admin genera clave age para access control:
   age-keygen -o ~/.config/sops/age/admin.txt

2. Admin configura variable:
   export SOPS_ADMIN_AGE_KEY=~/.config/sops/age/admin.txt

3. Admin crea team.json con participantes y grupos

CREACIÓN DE CONTENIDO:
4. Admin crea banco: create-bank.js --name "Examen" --id examen
5. Admin agrega preguntas: add-question.js ...
6. Admin crea clave: create-key.js --bank quiz/banks/examen.json
7. Admin agrega respuestas: create-key.js --key quiz/keys/examen.json --add q-001 --correct 1

ASIGNACIÓN DE ACCESO:
8. Admin asigna acceso: manage-keys.js --grant --key quiz/keys/examen.json --read quiz-admin,evaluadores --write 10488134

CIFRADO:
9. Admin cifra: encrypt-key.js quiz/keys/examen.json
10. Clave cifrada se commitea: git add quiz/keys/examen.json && git commit

USO POR MIEMBROS:
11. Miembro 10488134 descifra: sops -d quiz/keys/examen.json
12. Miembro 10488134 evalúa: evaluate.js --bank quiz/banks/examen.json --all
13. Miembros de evaluadores descifran y evalúan también
```

## Cambios en .gitignore

```diff
+ quiz/keys/team-public.json
+ quiz/keys/access.json.enc
+ quiz/keys/approvals.json.enc
- quiz/keys/
+ quiz/keys/*.enc.json
```

## Tests (TDD)

### Fase A: Core Infrastructure

| Test | Descripción | Estado |
|------|-------------|--------|
| `upload-key.test.js` | Subir clave pública → queda pending | ✅ |
| `approve-key.test.js` | Aprobar clave → status active | ✅ |
| `reject-key.test.js` | Rechazar clave → status rejected | ✅ |
| `grant-access.test.js` | Asignar acceso read/write | ✅ |
| `revoke-access.test.js` | Revocar acceso | ✅ |
| `resolve-groups.test.js` | Resolver grupos múltiples | ✅ |

### Fase B: Encryption

| Test | Descripción | Estado |
|------|-------------|--------|
| `encrypt-multi-person.test.js` | Cifrar para múltiples IDs | ✅ |
| `encrypt-with-groups.test.js` | Cifrar resolviendo grupos | ✅ |
| `encrypt-no-access.test.js` | Error si no hay acceso | ✅ |
| `encrypt-only-active.test.js` | Solo cifrar para claves active | ✅ |

### Fase C: Lifecycle

| Test | Descripción | Estado |
|------|-------------|--------|
| `new-member-flow.test.js` | Flujo completo: nuevo miembro | ✅ |
| `remove-member-flow.test.js` | Flujo completo: miembro saliente | ✅ |
| `revoke-access-flow.test.js` | Flujo completo: revocación | ✅ |
| `rotate-key-flow.test.js` | Flujo completo: rotación | ✅ |

### Fase D: Security

| Test | Descripción | Estado |
|------|-------------|--------|
| `impersonation.test.js` | No puede subir clave por otro ID | ✅ |
| `pending-not-active.test.js` | Clave pending no se usa para cifrar | ✅ |
| `admin-only-grant.test.js` | Solo admin puede grant | ✅ |
| `admin-only-revoke.test.js` | Solo admin puede revoke | ✅ |
| `access-encrypted.test.js` | access.json.enc cifrado con admin key | ✅ |
| `approvals-encrypted.test.js` | approvals.json.enc cifrado con admin key | ✅ |

## Archivos a Crear/Modificar

| Archivo | Acción | TDD |
|---------|--------|-----|
| `quiz/cli/manage-keys.js` | Crear | ✅ Tests primero |
| `quiz/cli/encrypt-key.js` | Modificar | ✅ Tests primero |
| `quiz/keys/team-public.json` | Crear (estructura) | ✅ |
| `quiz/keys/access.json.enc` | Crear (cifrado) | ✅ |
| `quiz/keys/approvals.json.enc` | Crear (cifrado) | ✅ |
| `quiz/tests/manage-keys.test.js` | Crear | ✅ |
| `quiz/tests/encrypt-key.test.js` | Expandir | ✅ |
| `quiz/tests/lifecycle.test.js` | Crear | ✅ |
| `quiz/tests/security.test.js` | Crear | ✅ |
| `.gitignore` | Modificar | ✅ |
| `AGENTS.md` | Actualizar docs | ✅ |
| `quiz/manuals/admin.md` | Actualizar docs | ✅ |

## Verification

- [x] manage-keys.js funciona (upload, approve, reject, grant, revoke)
- [x] access.json.enc solo se puede modificar con admin key
- [x] Clave pending NO se usa para cifrar
- [x] Clave active SÍ se usa para cifrar
- [x] Solo admin puede approve/revoke/grant
- [x] No se puede suplantar identidad (upload requiere admin approval)
- [x] encrypt-key.js cifra para múltiples IDs y grupos
- [x] encrypt-key.js resuelve grupos múltiples correctamente
- [x] Clave cifrada se puede descifrar con clave age correcta
- [x] Clave cifrada NO se puede descifrar con clave incorrecta
- [x] Proceso nuevo miembro funciona completo
- [x] Proceso miembro saliente funciona completo
- [x] Proceso revocación funciona completo
- [x] Tests pasan (315/315)
- [x] Instalado en ../test-ai-test funciona
