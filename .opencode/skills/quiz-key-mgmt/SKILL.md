---
name: quiz-key-mgmt
description: Multi-person key management — access control, approvals, and team key lifecycle for quiz and tutorial keys.
license: MIT
scripts:
  - ../../quiz/cli/manage-keys.js
  - ../../quiz/cli/encrypt-key.js
---

# Quiz Key Management (Multi-Person)

Manage access-controlled keys for teams. Handles who can read/write keys, approval workflows, and key lifecycle.

## Role Detection

Before running commands, check the user's role:
- **Admin**: Can grant/revoke access, approve/reject keys, list all access
- **Member**: Can upload their own key, check who has access, view their own status
- **Pending**: Waiting for admin approval — can only see their pending status

Use `team.json` to identify the user's role. Check `groups` array for 'admin' membership.

## Key Management Actions

### Upload Member Public Key (Member Self-Service)

```bash
node quiz/cli/manage-keys.js --upload-key --id 100 --public-key "age1..."
```

### Approve/Reject Key Request (Admin Only)

```bash
node quiz/cli/manage-keys.js --approve --id 100 --approved-by admin
node quiz/cli/manage-keys.js --reject --id 100 --reason "Not authorized"
```

### Remove Member Key (Admin Only)

```bash
node quiz/cli/manage-keys.js --remove-key --id 100
```

### Grant Access to Key (Admin Only)

```bash
node quiz/cli/manage-keys.js --grant --key quiz/keys/test.json --read 100,evaluadores --write 100
```

### Revoke Access from Key (Admin Only)

```bash
node quiz/cli/manage-keys.js --revoke --key quiz/keys/test.json --read 100 --write 100
```

### List Access (Admin Only)

```bash
node quiz/cli/manage-keys.js --list-access
```

### Who Can Access a Key (Admin/Member)

```bash
node quiz/cli/manage-keys.js --who-access-for --id 100
```

### List Pending Approvals (Admin Only)

```bash
node quiz/cli/manage-keys.js --list-pending
```

### Process Approval (Admin Only)

```bash
node quiz/cli/manage-keys.js --process-approval --id 100 --action approve
node quiz/cli/manage-keys.js --process-approval --id 100 --action reject --reason "Spam"
```

## Encrypted Storage

Access control and approvals are encrypted with sops/age:
- `quiz/keys/access.json.enc` — Who can read/write which keys
- `quiz/keys/approvals.json.enc` — Pending/approved/rejected key requests
- `quiz/keys/team-public.json` — Member public keys (committed)

Decryption requires `SOPS_AGE_KEY_FILE` env var pointing to private key file.

## Workflow

### New Member Onboarding

1. Member uploads public key: `--upload-key`
2. Admin reviews: `--list-pending`
3. Admin approves: `--approve`
4. Admin grants access: `--grant --key KEY --read ID`

### Member Leaves

1. Admin revokes access: `--revoke --key KEY --read ID`
2. Admin removes key: `--remove-key --id ID`

### Key Rotation

1. Member uploads new public key: `--upload-key`
2. Admin approves: `--approve`
3. Re-encrypt keys with `encrypt-key.js`
4. Revoke old access

## Security Rules

- Only admins can approve/reject keys
- Rejected keys cannot be re-activated
- `access.json.enc` and `approvals.json.enc` are encrypted — only admins can read
- Members cannot grant/revoke access themselves
- All actions are logged with timestamps

## Related Skills

- [[quiz-key]] — Single-person key management
- [[quiz-bank]] — Create question banks
- [[quiz-admin]] — Admin reports and evaluation
