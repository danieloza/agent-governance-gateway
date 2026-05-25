# Agent Governance Gateway

Agent Governance Gateway is a FastAPI-based prototype for scoped, auditable and revocable access control for enterprise AI agents. Instead of giving agents unrestricted API keys, the gateway supports agent registration, human approval, short-lived scoped credentials, policy checks, PII redaction, tool-level access control and audit logs.

## What problem this solves

Enterprise AI agents often need to work with HR, Finance, Legal or Operations workflows. The unsafe shortcut is to hand the agent direct API keys or database credentials. That breaks least privilege, makes auditability weak and turns revocation into an operational mess.

This project forces a safer workflow:

- register the agent
- request scopes
- wait for human approval
- receive a short-lived scoped token
- call tools through a policy-enforced gateway
- redact sensitive data before it leaves the boundary
- audit every important action

## Why agents should not receive unrestricted API keys

- no scope boundaries
- no human approval checkpoint
- difficult revocation
- poor auditability
- direct path to PII and financial records
- weak separation between agent reasoning and system permissions

## Architecture diagram in text form

```text
AI Agent
  -> POST /agent-auth/register
  -> Human/Admin approves scopes
  -> POST /agent-auth/token
  -> POST /tools/...
       -> JWT validation
       -> Policy engine
       -> Scope check
       -> Mock tool execution
       -> PII redaction
       -> Audit log write
  <- Safe structured response
```

## Project structure

```text
agent-governance-gateway/
  app/
    __init__.py
    main.py
    database.py
    models.py
    schemas.py
    auth.py
    policies.py
    audit.py
    tools.py
    redaction.py
    config.py
  tests/
    conftest.py
    test_agent_registration.py
    test_approval.py
    test_token.py
    test_tools_policy.py
    test_revocation.py
    test_redaction.py
  examples/
    sample_agent_client.py
  docs/
    ARCHITECTURE.md
    REDPANDA_POSITIONING.md
  README.md
  requirements.txt
  .env.example
  .gitignore
```

## Main endpoints

- `GET /.well-known/agent-auth.json`
- `POST /agent-auth/register`
- `POST /agent-auth/approve/{agent_id}`
- `POST /agent-auth/token`
- `POST /agent-auth/revoke/{agent_id}`
- `GET /agent-auth/audit`
- `POST /tools/hr/search_employee_policy`
- `POST /tools/finance/get_invoice_summary`
- `POST /tools/finance/create_expense_review`
- `POST /tools/legal/search_contract_clause`
- `POST /tools/legal/summarize_contract_risk`
- `POST /tools/ops/create_report`

## Example flow

1. Agent registers with scopes such as `finance:invoice:read`
2. Admin approves a subset of requested scopes
3. Agent asks for a short-lived JWT
4. Agent calls a tool through `/tools/...`
5. Gateway checks policy, redacts PII and writes an audit log
6. Admin can revoke the agent at any time

## Run locally

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Open docs at:

- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Run tests

```bash
pytest -q
```

## curl examples

### 1. Register agent

```bash
curl -X POST http://127.0.0.1:8000/agent-auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"agent_name\":\"Finance Bot\",\"agent_type\":\"finance-agent\",\"requested_scopes\":[\"finance:invoice:read\",\"finance:expense:create\"],\"reason\":\"Invoice review workflow\",\"owner_user_id\":\"owner-001\"}"
```

### 2. Approve agent

```bash
curl -X POST http://127.0.0.1:8000/agent-auth/approve/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"approved_scopes\":[\"finance:invoice:read\"],\"approved_by\":\"admin-001\",\"expires_in_hours\":8}"
```

### 3. Issue token

```bash
curl -X POST http://127.0.0.1:8000/agent-auth/token ^
  -H "Content-Type: application/json" ^
  -d "{\"agent_id\":1}"
```

### 4. Call allowed tool

```bash
curl -X POST http://127.0.0.1:8000/tools/finance/get_invoice_summary ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"invoice_id\":\"INV-2026-1001\"}"
```

### 5. Call denied tool

```bash
curl -X POST http://127.0.0.1:8000/tools/legal/search_contract_clause ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"contract_id\":\"CTR-9\",\"clause_query\":\"termination\"}"
```

### 6. Revoke agent

```bash
curl -X POST http://127.0.0.1:8000/agent-auth/revoke/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"revoked_by\":\"admin-001\",\"reason\":\"Access no longer needed\"}"
```

### 7. Verify revoked token fails

```bash
curl -X POST http://127.0.0.1:8000/tools/finance/get_invoice_summary ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  -d "{\"invoice_id\":\"INV-2026-1001\"}"
```

Expected result: `403` because the gateway re-checks revocation state on every tool request.

## Enterprise AI governance mapping

This prototype maps directly to internal enterprise AI automation concerns:

- scoped access for internal agents
- approval workflow before production use
- auditability for HR, Finance, Legal and Ops requests
- revocation when an agent is disabled or repurposed
- PII redaction before data leaves the control layer
- explainable allow/deny decisions

This is not a chatbot. It is a governance and access-control layer for AI agents operating inside business workflows.

