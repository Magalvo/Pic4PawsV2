# Work-Item: PETS-001-Pet Draft Publish Lifecycle

## 1. Context & Problem

The approved SDD defines the `Pet` entity and requires that draft pets are visible only to authorized shelter members, while public feed visibility is limited to published pets belonging to verified shelters. `DB-001` established the schema contract and `AUTH-001` established role-aware authorization contracts. The domain still needs a testable pet lifecycle rule before UI or API work can publish pets.

## 2. Acceptance Criteria

- [x] Draft pet publishing requires an authorized active shelter actor for the pet shelter.
- [x] Draft pet publishing requires the shelter verification status to be `verified`.
- [x] Published pets require at least name, species, location label, short description and one public image.
- [x] Medical information remains structured and explicitly public-safe.
- [x] Publishing changes status from `draft` to `published` and sets `publishedAt`.
- [x] Non-draft pets cannot be republished through the draft publish transition.
- [x] Tests fail before implementation and pass after the lifecycle rules are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement UI screens.
- Do not implement API route handlers.
- Do not upload media or create signed URLs.
- Do not connect to Supabase or apply migrations.

## 4. Completion Notes

- Added pure pet lifecycle contracts for validating draft publish readiness and transitioning drafts to `published`.
- Reused `AUTH-001` shelter management authorization while keeping shelter verification as a separate publish reason.
- No UI, API, upload, Supabase connection or migration work was added.
- Full validation passed with Node `22.22.3`.
