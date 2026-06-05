# Work-Item: PET-MEDIA-001-Persisted Media for Pet Publishing

## 1. Context & Problem

`PETS-001` requires at least one image before a pet draft can be published. `MEDIA-DB-001` now defines how signed uploads become persisted `media_assets` records. The pet lifecycle needs to use persisted public media assets, not arbitrary media IDs, to decide which media can attach to pet drafts and satisfy the publish-image requirement.

## 2. Acceptance Criteria

- [x] Public image media assets from the same shelter can be attached to pet drafts.
- [x] Private documents, deleted media and media from another shelter cannot be attached to pet drafts.
- [x] Attaching the first valid public image sets it as the draft hero media.
- [x] Publishing validation can verify that attached media IDs resolve to persisted public images.
- [x] Publishing a draft with only private or mismatched media remains blocked.
- [x] Tests fail before implementation and pass after pet media lifecycle rules are implemented.
- [x] Final validation passes: `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

## 3. Non-Goals

- Do not implement upload UI.
- Do not connect to Supabase.
- Do not mutate live pet or media records.
- Do not generate image derivatives.

## 4. Completion Notes

- Added persisted media asset lifecycle rules to the pet domain contract.
- Added attach validation for same-shelter public image media and automatic first hero media selection.
- Publishing validation can now resolve attached media IDs against persisted public media assets.
- Private documents, deleted media, cross-shelter media and duplicate attachments are rejected.
- No DB writes, Supabase access, R2 access or UI were added.
