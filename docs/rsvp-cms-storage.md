# RSVP CMS storage proposal

## Entities
- **RsvpDesign**: persisted per event and versioned so designers can iterate without losing drafts.
  - `eventId`: string
  - `version`: integer (auto-increment)
  - `theme`:
    - `accentColor`: hex string (e.g., `#c084fc`)
    - `background`: `{ type: "color" | "image" | "video", color?: string, assetUrl?: string }`
    - `overlayOpacity`: number (0-0.9)
  - `layout`: `{ width: number, maxHeight: number }` (mobile-first sizes in px)
  - `previewModes`: `("mobile" | "desktop")[]` (so the CMS knows which canvases to render)
  - `blocks`: ordered array of **RsvpBlock** (see below)
  - `updatedAt` / `updatedBy`
- **RsvpBlock** union (stored as JSON):
  - `headline`: `{ id, type: "headline", title, subtitle?, align, accentClass, accentColor? }`
  - `text`: `{ id, type: "text", body, width, align, muted? }`
  - `info`: `{ id, type: "info", label, content, accentClass, accentColor? }`
  - `image`: `{ id, type: "image", images: [{ id, src, alt? }...], activeImageId?, caption?, height: "short" | "medium" | "tall" }` (support stacked uploads per block)
  - `formField`: `{ id, type: "formField", formFieldId, label, placeholder?, required?, width, hint?, typeKey? }` (link `formFieldId` to Question/FormField API ids)
  - `cta`: `{ id, type: "cta", label, href?, align, accentColor? }`
  - `sectionImage?`: `{ id, src, alt? }` (optional spotlight image used as a default background for the block)
  - `background`: `{ images: [{ id, src, alt? }...], activeImageId?, overlay? }` (per-block galleries with overlay strength; when `sectionImage` exists it should be treated as the fallback background)
  - `share`: `{ token: string, link: string }` (optional) used only for generating random public previews; the share endpoint can hydrate from cached snapshots keyed by `token`.
  - `flowPreset`: `"serene" | "parallax" | "stacked"` (controls scroll feel and snap mode for public/full-page previews)

## API shape
- `GET /rsvps/:eventId/design`: returns the latest `RsvpDesign` payload for hydration.
- `POST /rsvps/:eventId/design`: creates a new version with the client payload plus `version` bump.
- `PUT /rsvps/:eventId/design/:version`: replaces a specific version (admin-only) for rollbacks.

## Storage notes
- Keep media assets (image/video) in object storage; persist `assetUrl` references only.
- Store colors as hex strings so frontend and email templates match exactly; persist chosen accent colors per design.
- Preserve block order as given in the `blocks` array; reordering in the UI simply rearranges this list.
- Consider `draft` vs `published` flags to control what the public RSVP page renders.
- Add lightweight validation: width/height between `320-900`, overlay between `0-0.9`, and block ids unique.
- Form blocks should hydrate directly from `FormFieldsEndpoints` responses; keep `formFieldId` and the API `type`/`typeKey` for renderers to build native inputs without double entry.
- Public previews can be served from a cache keyed by `share.token`; when a designer generates a link, store the serialized design plus global theme under that token to hydrate `/rsvp/share/:token` without exposing draft IDs.
