---
audited-through: 103bc96031da1c1543b81dca002f543a1c6004c7
pr: "#201"
scope: "feat: IFTHENPAY-WEBHOOK-001 ifthenpay payment webhook verifier"
score: "preliminary"
---

# Preliminary SDD Audit - PR #201 Ifthenpay Webhook Verifier (2026-06-20)

**Auditor**: Independent Codex audit session
**Branch**: `agent/IFTHENPAY-WEBHOOK-001`
**Commit**: `103bc96031da1c1543b81dca002f543a1c6004c7`
**Scope**: Preliminary review of the initial Ifthenpay webhook verifier implementation.

This audit was intentionally scoped to the PR diff and the canonical payment/webhook
requirements. It did not remediate code.

---

## 1. Validation Performed

- `npm.cmd test -- tests/workers/ifthenpay-verifier.test.ts tests/workers/payment-webhook.test.ts`
  - Result: passed
  - Coverage observed: 22 tests passed
- `npm.cmd run typecheck`
  - Result: passed

The first `npm test` attempt through PowerShell failed because local execution policy
blocked `npm.ps1`; the validation was rerun successfully through `npm.cmd`.

---

## 2. Executive Summary

The PR is small and well bounded: it adds `createIfthenpayWebhookVerifier`, changes
`PaymentWebhookVerifier` to async, wires Ifthenpay into the production Worker default
handler when `PAYMENT_PRIMARY_PROVIDER=ifthenpay`, and adds focused verifier tests.

The TypeScript mechanics are sound and the touched tests pass. The main preliminary
risk is not local implementation shape; it is whether the Ifthenpay protocol assumed
by the work item is actually the provider's production/sandbox protocol. The current
tests generate signatures with the same local HMAC helper as the implementation, so
they prove internal consistency but not PSP compatibility.

---

## 3. Findings By Severity

### P0

No P0 findings found.

### P1-1: Ifthenpay protocol is not validated against official PSP evidence

**Severity**: P1

**Evidence**

- `docs/work-items/IFTHENPAY-WEBHOOK-001-ifthenpay-webhook-verifier.md` defines the
  webhook contract as JSON with `requestId`, `estado`, `valor`, `dataHora`, HMAC-SHA256
  over `rawBody`, and a signature header.
- `apps/workers/src/ifthenpay-verifier.ts` implements that contract locally by reading
  `signatureHeader`, verifying HMAC-SHA256, parsing JSON and mapping `requestId` /
  `estado` into `ParsedWebhookEvent`.
- `tests/workers/ifthenpay-verifier.test.ts` computes signatures with a local helper
  equivalent to the implementation, but no official Ifthenpay fixture, sandbox payload
  or provider documentation is captured in the PR.
- The canonical architecture requires the Worker to verify PSP signature/secret before
  writing financial events, and the SDD requires payment state to come from verified
  server-side PSP events.

**Impact**

The verifier can pass all local tests while still rejecting real Ifthenpay callbacks,
or worse, implement a verification model that differs from the provider's real
security model. This directly affects financial state transitions.

**Recommendation**

Before merge or production enablement, attach official Ifthenpay documentation or a
sandbox callback fixture covering:

- exact callback transport and payload shape,
- exact signature source string,
- exact header or field name used for the signature/anti-phishing secret,
- encoding/casing rules for the digest,
- representative paid, cancelled and failed events.

Then update the verifier and tests to use those fixtures as golden tests.

**Required test or validation**

Add at least one golden test using an official/sandbox Ifthenpay callback payload and
signature. The test should fail if the implementation changes serialization, header
name, digest casing or field mapping incorrectly.

### P2-1: Signed payload validation is weaker than the documented contract

**Severity**: P2

**Evidence**

- The work item declares `valor` and `dataHora` as required fields in
  `IfthenpayWebhookPayload`.
- `apps/workers/src/ifthenpay-verifier.ts` only requires `requestId` and `estado`
  before accepting the payload and returning a financial transition.
- `valor`, `dataHora`, `referencia` and `entidade` are not validated beyond being
  preserved in the raw payload.

**Impact**

A signed but incomplete callback can still produce `paid`, `cancelled` or `failed`.
That weakens audit quality for financial transitions and diverges from the PR's own
contract. If amount/date reconciliation is later added, historical events may be
missing required fields.

**Recommendation**

Validate the full payload shape with a runtime schema, preferably Zod, matching the
canonical architecture requirement for webhook payload validation. If some Ifthenpay
fields are genuinely optional by payment method, encode that explicitly by method/status
rather than accepting any object with only `requestId` and `estado`.

**Required test or validation**

Add signed invalid-payload tests:

- missing `valor` is rejected,
- missing `dataHora` is rejected,
- non-string `requestId`/`estado`/`valor`/`dataHora` are rejected,
- optional method-specific fields are accepted only under documented conditions.

### P2-2: Worker default composition path is not tested

**Severity**: P2

**Evidence**

- `apps/workers/src/index.ts` injects `createIfthenpayWebhookVerifier()` only when
  `parsedConfig.config.payments.primaryProvider === 'ifthenpay'`.
- The new tests cover `createIfthenpayWebhookVerifier` directly and the generic
  `handleWorkerPaymentWebhookRequest` path, but not the production default Worker
  composition path.

**Impact**

A future regression in dependency composition can silently return
`payment_webhook_verifier_not_configured` in production even while the isolated verifier
tests keep passing.

**Recommendation**

Add a Worker-level test for the default fetch/composition path with:

- `PAYMENT_WEBHOOKS_ENABLED=true`,
- `PAYMENT_PRIMARY_PROVIDER=ifthenpay`,
- valid Ifthenpay webhook secret,
- signed callback payload,
- repository mock proving the verified event reaches persistence.

**Required test or validation**

The test should assert that the response is not `501`, that the repository receives
`provider: 'ifthenpay'`, and that `providerPaymentId`, `providerEventId` and `newStatus`
match the verified payload.

### P2-3: Graphify report was not updated for this payment-sensitive code change

**Severity**: P2

**Evidence**

- `graphify-out/GRAPH_REPORT.md` reports graph freshness from commit `263b99f3`.
- The audited PR commit is `103bc96031da1c1543b81dca002f543a1c6004c7`.
- `AGENTS.md` requires `graphify update .` after any code change.

**Impact**

The precomputed architecture map used by future agents and audits does not include
this new PSP verifier and Worker wiring. This is especially risky because payment
webhooks are security- and finance-sensitive.

**Recommendation**

Run `graphify update .` before merge and include the updated report in the PR, unless
the team intentionally defers Graphify updates through a documented CI process.

**Required test or validation**

Add or run a Graphify freshness check comparing the report commit with `git rev-parse HEAD`.

### P3-1: Work item is marked done without Completion Notes

**Severity**: P3

**Evidence**

- `docs/work-items/IFTHENPAY-WEBHOOK-001-ifthenpay-webhook-verifier.md` has
  `status: done`.
- The document contains Goal, States, Contract and Affected Files, but no Completion
  Notes section recording validations, caveats or provider evidence.

**Impact**

Traceability is weaker for a payment-sensitive work item. Future reviewers cannot see
whether the verifier was tested only with local fixtures or against provider evidence.

**Recommendation**

Add Completion Notes before merge. They should include validation commands, whether
official Ifthenpay fixtures were used, and any production enablement caveats.

**Required test or validation**

The SDD hygiene check should either require Completion Notes for `status: done` work
items or this work item should be updated manually before merge.

---

## 4. Positive Observations

- The PR is scoped to one work item and uses the required `agent/` branch style.
- The async verifier type change is reflected in the generic webhook handler and passes
  repository-level typecheck.
- `paymentWebhookVerifier` is injected only for `PAYMENT_PRIMARY_PROVIDER=ifthenpay`;
  other providers still fail closed with `payment_webhook_verifier_not_configured`.
- Signature verification happens before payload parsing and repository access.
- Invalid JSON, missing `requestId`, missing `estado` and signature mismatch are covered
  by unit tests.

---

## 5. Areas Not Fully Audited

- Official Ifthenpay documentation was not available in-repo and public search did not
  yield a reliable primary source during this preliminary review.
- The full `npm run lint`, `npm run build` and full `npm run test` gates were not run;
  only focused tests plus full typecheck were executed.
- No live/sandbox Ifthenpay callback was replayed.
- No remediation was performed.

---

## 6. Recommended Merge Gate

Do not enable this verifier for production traffic until P1-1 is resolved with official
or sandbox provider evidence. P2 findings can be handled in the same PR if the branch
is still open, or in a tightly scoped follow-up before payment rollout.

