---
description: Multi-person key management — access control, approvals, and team key lifecycle. Usage: /key-mgmt
---

Load the quiz-key-mgmt skill. CRITICAL: You MUST load it with the `skill` tool before starting the workflow.

The user wants to manage quiz key access control. Detect their role first:
- Check `team.json` for their ID and groups
- Admin: Can do everything (grant, revoke, approve, reject)
- Member: Can upload their own key, check access, view status
- Pending: Can only see their pending status

Use the question tool to present the appropriate menu based on role:

**Admin menu:**
1. Upload member key (for another member)
2. Approve/reject key request
3. Grant access to a key
4. Revoke access from a key
5. List all access
6. Check who can access a key
7. View pending approvals

**Member menu:**
1. Upload my public key
2. Check my access status
3. View keys I can access

IMPORTANT: Every time you use the question tool with `options`, you MUST also set `custom: false` to prevent free text input. This applies to ALL questions.
