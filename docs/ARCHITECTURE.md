# Architecture

## Overview

Agent Governance Gateway sits between AI agents and internal business tools.

1. Agent registers with requested scopes.
2. Human approves selected scopes and an approval window.
3. Agent requests a short-lived JWT.
4. Agent calls tools through the gateway only.
5. Gateway validates token, policy and scope.
6. Response is PII-redacted before leaving the gateway.
7. Every important action is written to audit logs.

## Layers

- `app/auth.py`: JWT creation and validation
- `app/policies.py`: default-deny policy engine and tool-to-scope mapping
- `app/audit.py`: audit logging helper
- `app/redaction.py`: PII redaction layer
- `app/tools.py`: mock business tool implementations
- `app/main.py`: FastAPI endpoints and orchestration

## Design Notes

- Agents do not receive direct database credentials.
- Scopes are approved explicitly by a human.
- Tokens are short-lived and revocable.
- Policy checks happen per tool request.
- Tool output is mock data for MVP safety and portability.

