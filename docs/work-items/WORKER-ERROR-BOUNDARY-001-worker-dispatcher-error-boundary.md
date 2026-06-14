---
id: WORKER-ERROR-BOUNDARY-001
title: Worker dispatcher top-level error boundary
status: done
pr: 123
---

## Goal

Wrap the entire body of `handleWorkerRequest` in a top-level try/catch so that
uncaught throws from any route handler return a structured JSON 500 response
rather than an opaque Cloudflare runtime error.

## States

- `dispatching`: the Worker is parsing config and routing the request.
- `handled`: a route returns its own response.
- `not_found`: no route matches the request.
- `internal_server_error`: an unexpected throw is caught and converted to safe JSON.

## Contract

Any unhandled throw inside `handleWorkerRequest` returns:
```
HTTP 500
{ status: 'internal_server_error' }
```

Error message and stack must NOT appear in the response body.

## Affected files

- `apps/workers/src/index.ts` — wrap `handleWorkerRequest` body in try/catch
- `tests/workers/error-boundary.test.ts` — new tests
