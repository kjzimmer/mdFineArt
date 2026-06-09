# Gallery Setup Options

Options that are likely to vary between artists. Currently controlled by
`client/src/config/gallery.ts`. Long-term these should move to a per-artist
record in the DB as part of a SaaS onboarding flow.

---

## Implemented

### `showSubject` · boolean · default `false`
Show/hide a subject/category field on painting records.
- **Public:** badge overlaid on gallery card image, filter controls
- **Admin:** Subject select in add/edit form, subject shown in painting list row
- *Melody's work doesn't use subject categories; other artists (wildlife vs
  landscape vs portrait painters) may want to filter and label by subject.*
- **Future:** Onboarding question — "Do you want to categorize your work by subject?"
  If yes, allow the artist to define their own subject list.

### `printsAutoFromResolution` · boolean · default `true`
Determines print availability automatically from the original image's pixel
dimensions rather than a manual checkbox.
- Tiers (shortest side): large ≥ 5000 px, medium ≥ 3000 px, small ≥ 1500 px, web-only < 1500 px
- Manual override checkbox is hidden when this is `true`
- *Set at upload time and can be refreshed by re-running the backfill script*
- **Future:** Could be a per-artist preference — some artists may want to control
  print availability manually regardless of resolution.

---

## Identified, not yet implemented

### Art type
Affects terminology throughout the site ("Painting" vs "Photograph" vs "Sculpture"),
default subject categories, and potentially the metadata fields shown.
- **Onboarding question:** "What kind of art do you make?"
- Drives field labels, filter names, and which metadata fields are relevant.

### Price display
Show price, hide price, or show "Price on request" as default.
- Some artists prefer not to list prices publicly.
- Could also affect currency symbol and formatting.

### Commission requests
On/off toggle for the commission inquiry form.
- Not all artists accept commissions.

### Prints feature
Whether the site offers prints at all (with Square checkout), or whether
"prints available" is purely informational (inquiry-only), or disabled entirely.

### Featured / spotlight paintings
How many featured paintings appear on the home page and how they are selected
(manual vs auto from newest/most recent).

### Newsletter / mailing list
On/off. Some artists have no interest in maintaining a mailing list.

### Events / exhibitions section
On/off. Relevant for artists who exhibit publicly; less so for studio-only artists.
