---
name: format-report-authoring
description: "Use when an analysis should outlive the chat — publishing findings into Format as a real report with its own share URL, rather than answering in the conversation. Trigger phrases include 'publish this as a report', 'write this up in Format', 'turn this analysis into a report', 'make this shareable', 'create a Format report', 'update that report', 'send the report to the team', or 'add a chart to the report'. Covers the whole authoring loop: what the block types are and when each one earns its place, how to compose a document that reads as a report rather than a data dump, embedding insights as clickable chips or full quote blocks, tables and charts, the draft-then-publish lifecycle, revising with replace_report, images, and emailing it with send_report. Report authoring is enabled per organization — when the write tools aren't on your connection, say so and deliver the analysis another way. Not for finding the evidence itself; the research skills do that."
metadata:
  display_order: 110
  title: Report Authoring
  personas: [product, marketing, research, leadership]
  image: card.jpg
  use_case: >-
    Turn an analysis into a real Format report instead of a chat message —
    a shareable page where embedded insights stay clickable and playable at
    the source. This is the craft half: which block earns its place, how a
    report reads as an argument rather than an export, and the
    draft-review-publish loop.
  limitations: >-
    Report authoring is enabled per organization, so the write tools may not
    be on your connection at all. It composes and publishes; it does not do
    the research — pair it with a skill that gathers the evidence first.
    Format does no AI work here: everything on the page is what you wrote.
  prompts:
    - "Publish this analysis as a Format report and share the link."
    - "Turn what we just found into a report — embed the strongest insights."
    - "Update the report we published last week with this month's numbers."
---

# Report Authoring

## What this skill is for

Most analysis dies in a chat window. `create_report` is how it stops doing
that: you supply a title, a `tldr`, and a structured `document`, and Format
persists and renders it as a first-class report with a stable share URL,
insight playback and audio. **Format does no AI work here** — nothing is
generated, summarised or rewritten on Format's side. The page is exactly
what you wrote.

Two things follow from that, and they are the whole reason this skill exists:

- **A report is a live artifact, not an export.** Embedded insights stay
  clickable and playable at the source; a reader can hear the customer say
  the line you built the argument on. A pasted markdown summary can't do that.
- **The craft is entirely yours.** Format validates that the document is
  well-formed, that the references resolve, and that you're allowed to write
  it. It has no opinion on whether the report is any good. This skill is that
  opinion.

**This authors a report directly** — it does not trigger Format's automated
report pipeline, which generates reports from a schedule. `list_reports`
shows both kinds side by side, discriminated by `kind`.

## Before you start: is authoring open?

Report authoring is gated **per organization**. When it's closed, the write
tools are simply not on your connection — there is nothing to call and
nothing to error. Check whether `create_report` is available before promising
a report; if it isn't, say so plainly and deliver the analysis another way (a
markdown document, an HTML page, a chat summary). Don't retry, and don't
describe the report you would have made.

One more case worth knowing: an API-key connection with no owning user cannot
author at all, and says so (`OWNERLESS_KEY: report authoring requires an
acting user`). That is a connection problem, not something to work around.

## The document model

The report body is a typed block tree. The top-level `document` is:

```
{ version: 1, blocks: Block[] }
```

Each block has an `id` — unique within the document; pick something semantic
like `"intro"` or `"pricing-table"` — and a `type`:

| Type | What it is |
|---|---|
| `text` | markdown prose; the workhorse |
| `section` | a heading plus an array of child leaf blocks (one level of nesting — sections cannot contain sections) |
| `insight` | an embedded full insight: audio, speaker, the canonical quote |
| `table` | structured tabular data with markdown-able cells |
| `chart` | bar / line / area chart from inline data |
| `callout` | highlighted box for the through-line or a load-bearing warning |
| `image` | a captioned figure, full-bleed cover, or gallery grid |
| `component` | LLM-authored interactive HTML in a sandboxed iframe — **per-org gated**, see below |

---

## Per-block rubric

### TextBlock — `{ id, type: "text", body }`

Markdown prose. The body is GFM: bold, italic, lists, blockquotes, fenced
code and tables all work; raw HTML does not.

- One idea per paragraph. Short paragraphs. Lead with the claim.
- **Don't write `#`/`##` headings inside text.** Use a SectionBlock — that's
  what drives the table of contents.
- **Inline insight chips go inside text bodies**: `{{insight:<id>}}` renders a
  small chip with speaker and company; hover shows what they said, click opens
  the full insight. Use it as evidence-in-a-sentence: "Customers want pricing
  they can defend internally {{insight:abc123}}, not the lowest sticker."
- **Inline entity mentions** work the same way, in text bodies and table
  cells: `{{person:<id>}}` and `{{company:<id>}}` render name chips with a
  hover card; `{{record:<id>}}` renders a source citation (record icon +
  date). Prefer `{{record:<id>|display text}}` so the citation reads as part
  of the sentence — person and company chips always wear the entity's real
  name, so display text on those is ignored. Ids come from `list_persons` /
  `list_companies` / `list_records`; every mention is verified against the org
  at write time, and an unknown id fails the write naming the block.

### SectionBlock — `{ id, type: "section", heading, shortTitle?, summary?, level: 2|3, blocks: LeafBlock[] }`

Structural heading plus child blocks. Sections drive the right-side table of
contents.

- **3–6 sections is the sweet spot.** Fewer than 3 and there isn't enough
  structure to navigate; more than 6 and it's a deck masquerading as a report.
- `level: 2` is a top-level section, `level: 3` a sub-section. Most reports are
  all `level: 2`.
- `heading` is the full editorial headline, rendered as the big centred
  section title. It can breathe — a sentence-length headline works.
- `shortTitle` is the punchy 2–4 word nav label shown beside the section
  number and used as the contents entry. Omit it when the heading is already
  short and scannable, and **never make it a truncation of the heading**.
  Without it, `heading` labels the contents verbatim.
- `summary` is a one-to-three-sentence lede rendered centred under the
  headline, before the first child block. Use it to frame the section; don't
  duplicate the first text block.
- **Sections cannot contain sections.** The `blocks` array is leaf-only.

### InsightFullBlock — `{ id, type: "insight", insightId }`

A block-level embed: audio player, speaker attribution, and the canonical
quote rendered prominently. Use it when the quote **is** the point — when one
customer's words do the work of the paragraph.

This is the visually heaviest block on the page, roughly a screenful with its
audio player. That weight is exactly why it works, and it fades with
repetition: three embeds in a row read as a wall of cards. When several
insights make related points, the strongest one usually earns the embed; the
rest sit better as inline `{{insight:<id>}}` chips in prose, or as table rows
with a chip column.

Frame the block in the paragraph **before or after**, never inside it. Format
renders the quote canonically — if you also paste it into your prose, the
moment plays twice.

Good — the block does the heavy lifting:

```
{ id: "intro",   type: "text", body: "Frustration with onboarding came up more than any other theme. The clearest articulation came from a head of revenue ops mid-rollout:" }
{ id: "block-1", type: "insight", insightId: "abc123" }
{ id: "after",   type: "text", body: "That same pattern — small fixes blocking real adoption — repeats across three other accounts." }
```

Anti-pattern (the same words in prose *and* in the block):

```
{ id: "x", type: "text", body: 'Sarah at Acme said "the rollout was rough because nobody knew which Slack channel to ask in"' }
{ id: "y", type: "insight", insightId: "abc123" }
```

### TableBlock — `{ id, type: "table", headers: string[], rows: { cells: string[] }[], caption? }`

Use when comparing the same dimension across several subjects — companies,
topics, time periods. Cells are markdown-able and can hold `{{insight:<id>}}`
chips and entity mentions for attribution.

- One header per column; every row uses the same column order.
- **Don't use a table for a list.** That's a markdown list inside a TextBlock.
- A table is usually the nicest way to cite many insights at once: one row per
  finding with a chip column keeps ten sources scannable, where ten insight
  embeds would be a wall of cards.

```
{ id: "feature-requests", type: "table",
  caption: "Feature requests by org, last 7 days",
  headers: ["Org", "Request", "Role", "Source"],
  rows: [
    { cells: ["Acme",  "Bulk CSV export", "Head of Ops", "{{insight:ins_001}}"] },
    { cells: ["Plaid", "SSO via Okta",    "IT lead",     "{{insight:ins_002}}"] },
    { cells: ["Asana", "Webhook retries", "Eng manager", "{{insight:ins_003}}"] }
  ]
}
```

### ChartBlock — `{ id, type: "chart", chartType: "bar"|"line"|"area", title?, caption?, data }`

For trend shapes (line, area) or comparisons (bar). `data` is inline values
you supply: `[{ x: "Jan", series: { mentions: 12, customers: 5 } }, ...]`,
with the same series keys across every point.

If a numeric claim has no visual story, prefer a table or a sentence. **One
chart per report is plenty.**

Bar charts render well even with many or long category names — past roughly
six categories, or with long labels like theme or account names, the renderer
lays the bars out horizontally so every category keeps a readable label. So a
plain `chart` block with `chartType: "bar"` is all you need for a labelled bar
chart, a ranked bar list, or grouped bars. Author it and let it orient itself.

**Reach bars — the canonical way to visualise demand.** When showing how many
accounts care about something (themes from `search_insight_groups`), make
**distinct customers the bar** and let **mentions** ride along as a quiet
annotation. Don't plot both as competing bars: mentions is usually the bigger
number and would visually dominate the breadth you actually want to lead with.
Put both values in each point's `series`, name the secondary one in
`annotationSeries`, and the renderer draws one bar per theme with a muted
`· N mentions` label at the bar's end. Rank descending by reach.

```
{ id: "reach", type: "chart", chartType: "bar",
  title: "Report-customization themes, by reach",
  annotationSeries: ["mentions"],
  data: [
    { x: "Audience-targeted segmentation", series: { customers: 10, mentions: 27 } },
    { x: "Report delivery flexibility",    series: { customers: 9,  mentions: 15 } },
    { x: "Self-serve onboarding",          series: { customers: 5,  mentions: 10 } }
  ]
}
```

`annotationSeries` is bar-charts-only, must name keys present in `series`, and
must leave at least one series plotted as bars.

Two honesty rules for these numbers, both inherited from where they come from:

- **Don't introduce lifecycle state.** Counts trace back to real insights;
  a lifecycle label doesn't, and putting one on a chart implies a measurement
  that isn't there.
- **`customerCount` ranks, it never sums.** Insight groups nest, so a customer
  counted in a narrow theme is counted again in every broader theme above it.
  Charting each theme's reach side by side is exactly right; adding the bars
  up to claim a total is exactly wrong.

### CalloutBlock — `{ id, type: "callout", variant: "tldr"|"info"|"warning"|"highlight", title?, body }`

A highlighted box. Reserve it for the through-line of the report or a
load-bearing warning — every callout dilutes the next. **A whole report
rarely needs more than one or two.** If you reach for a third, the content
belongs in prose; callouts scattered through a document read as nervous, not
authoritative.

- `tldr` — **don't.** The `tldr` *field* (below) already renders as the
  prominent opening deck, and a `tldr` callout on top of it states the finding
  twice, back to back. The variant exists for the rare long report that wants
  a second boxed summary deep in the document; it is not the opener.
- `highlight` — a pull-quote or claim worth singling out mid-document. At most
  one.
- `info` / `warning` — context or a caveat the reader needs in order to
  interpret the rest. One load-bearing warning at the end is often the single
  most useful callout in a report.

### ImageBlock — `{ id, type: "image", variant: "single"|"cover"|"gallery", images: [{ imageId?, caption?, alt?, aspect? }] }`

A captioned figure. `single` is one figure at reading-plus width, `cover` a
full-bleed hero, `gallery` a grid of two or more captioned tiles.

- `imageId` comes from the `upload_report_image` → PUT → `confirm_report_image`
  handshake. Use it **only when you can PUT the file's bytes yourself**:
  `upload_report_image({ contentType })` returns a presigned `uploadUrl` good
  for 30 minutes and a 10 MB cap; the PUT must send the same `Content-Type`
  and no extra `x-amz-*` headers. `confirm_report_image({ imageId })` then
  verifies the bytes, probes the dimensions, and makes the image referenceable.
- **If you don't hold the bytes** — a chat client, or a user who pasted an
  image — author a **placeholder slot** instead: omit `imageId`, write the
  `caption` (it tells both the reader and the uploader what belongs there) and
  an `aspect` hint so the layout reads correctly before upload. The report
  owner clicks the placeholder in the app to upload. Tell the user that's the
  next step.
- **Never** inline image data (base64, data URIs) and never point at an
  external image URL. The block takes confirmed uploads only. `single` and
  `cover` take exactly one slot; `gallery` takes two or more.

### ComponentBlock — `{ id, type: "component", html, data, caption? }` — gated

**Only available to organizations with the capability.** When it's closed the
block union simply doesn't contain the variant, and a `component` block is
refused at validation with a message naming the block types you *can* author.
Don't reach for it speculatively.

LLM-authored interactive HTML in a sandboxed iframe — the escape hatch when
the shape you need isn't covered by the other blocks: a filter over a sliced
table, a small-multiples grid with a toggle, an interactive matrix, a pie or
donut (ChartBlock does bar, line and area only). **Not** for a chart a bar
block already does well.

What the shell gives you for free — use these, don't reinvent them:

- **Colour tokens** on `:root` mirroring Format's palette: `--neutral-000`
  through `--neutral-900` for text and surfaces; `--chart-1` through
  `--chart-6` for **anything that encodes data** (bars, slices, series, legend
  swatches); and `--format-red` / `--format-cyan` / `--format-yellow` /
  `--format-magenta` reserved for the occasional loud brand accent — **not**
  for charts. Reference them anywhere a colour goes:
  `fill="var(--chart-1)"`, `style="color: var(--neutral-700)"`. The `--chart-*`
  ramp is the same muted editorial palette the native charts use, so a
  component's data viz sits beside a native chart without clashing. Start at
  `--chart-1` and walk up the ramp; hand-rolled hex and the bright `--format-*`
  hues both read off-brand inside a chart.
- **Font tokens**: `--font-sans` and `--font-serif`. `body` already uses
  `--font-sans` and SVG `<text>` inherits it. Don't redeclare unless you
  specifically want serif.
- **A base reset**: `box-sizing: border-box`, zeroed body margin, 24px body
  padding, 14px / 1.5 default type. The host card already provides the border,
  background and an "Interactive component — generated by AI" header — **don't
  wrap your content in another card**, that's double chrome.
- **Auto-height**: the iframe resizes to fit your content (clamped
  120–1200px). Don't set fixed heights or `overflow: scroll` — let it grow.

Fields and constraints:

- `html` — body content plus any inline `<script>` / `<style>`. CDN
  `<script src>` works for the allowlisted origins (cdn.jsdelivr.net,
  unpkg.com, cdn.tailwindcss.com). **External `<link rel="stylesheet">` is
  blocked by CSP** — use inline `<style>`.
- `data` — any JSON-serialisable value, read at runtime via
  `JSON.parse(document.getElementById('brief-data').textContent)`. It lives in
  the same document JSON and counts toward the 200 KB budget.
- `connect-src 'none'` — no fetch, no XHR, no WebSocket, no beacon. The
  component is static-data-only; if it needs data, put it in `data`.

A 3-slice pie that gets the defaults right:

```html
<svg viewBox="0 0 320 240" style="width:100%;max-width:320px;display:block;margin:0 auto">
  <path d="M160 120 L160 20 A100 100 0 0 1 255 156 Z" fill="var(--chart-1)"/>
  <path d="M160 120 L255 156 A100 100 0 0 1 187 215 Z" fill="var(--chart-2)"/>
  <path d="M160 120 L187 215 A100 100 0 1 1 160 20 Z" fill="var(--neutral-200)"/>
  <text x="200" y="90" fill="white" font-weight="600" font-size="16">20%</text>
  <text x="220" y="180" fill="white" font-weight="600" font-size="14">6%</text>
  <text x="100" y="140" fill="var(--neutral-700)" font-weight="600" font-size="16">74%</text>
</svg>
```

No card wrapper, no font declaration, no fixed height, chart palette via the
`--chart-*` tokens.

---

## Title and TL;DR — separate fields, not blocks

**`title`** — a specific, claim-shaped headline. Around 50–80 characters
renders best; 200 is the hard cap.

- Good: "Why customers want quantification on top of qualitative insights"
- Bad: "Q4 customer feedback summary" — generic, says nothing

**`tldr`** — a one-to-two-sentence deck, the hook readers see before they
scroll. 600 characters max.

- Good: "Customers don't reject pricing — they reject pricing they can't
  explain to their boss. Three customers show the pattern across DocuSign,
  Asana and Plaid."
- Bad: "This report explores customer feedback on pricing." — filler

## The authoring workflow

1. **Gather the evidence first.** `search_insight_groups` for the themes,
   `search_insights` for the words underneath them (`supportingGroupId` drills
   from one to the other), `count_insights` for anything you're going to state
   as a number, `get_record` when you need the whole conversation. Collect the
   insight ids as you go — those are what the chips and embeds reference.
2. **Compose the document.** Pick the through-line, structure it into 3–6
   sections, decide for each insight whether it's a chip or a block, and build
   any tables or charts.
3. **Generate stable block ids as you go** — they anchor the contents and keep
   revision diffs readable.
4. **`create_report` to persist.** The report is born a **draft**: the share
   URL works for you, its creator, and for nobody else in the org yet. Pass
   `validateOnly: true` first if you want the document checked without
   persisting anything — it comes back with `blockCount`, `refCount`, `bytes`,
   and the date range your referenced insights span.
5. **Review, then publish.** Read it back with `get_report`, revise with
   `replace_report`, let the user open the `shareUrl` — then `publish_report`
   makes it visible to the whole organization on their Reports page. For
   one-shot flows where review isn't wanted, pass `publish: true` on the
   create instead.
6. **Leave a `handoff`.** Markdown, up to 100k: your underlying research and
   reasoning, the notes you'd hand another agent — which records drove a
   number, what you ruled out and why. It never renders. It is what lets
   someone (or a future agent, via `get_report`) continue the analysis instead
   of redoing it. Pass it on the create, or add it later with `replace_report`.
   `publish_report` will nudge you once if there isn't one.
7. **To iterate, don't re-create.** Call `get_report` with the `reportId`,
   revise, `replace_report`. Two same-title creates inside 15 minutes are
   rejected with a pointer to the report that already exists. Replacing a
   published report updates the live document immediately.

**`replace_report` replaces the entire tree.** Omitted top-level fields stay
as they were, but a block you leave out of a supplied `document` is deleted —
there are no partial patches. Publish state never changes: a draft stays
private, a published report's live document updates in place. Each call writes
a new revision, so the history stays clean.

**Advisories.** A successful `create_report` or `replace_report` may carry
`advisories` — non-blocking notes from the renderer's side of the page, such
as a run of insight embeds that will read as a wall of cards. You can't see
the rendered layout; these are that glance. They never fail anything. Read
them, apply what you agree with via `replace_report`, and leave the rest.

## After publishing

- **`send_report`** puts it in people's inboxes — the same "Send" the report
  owner has in the app. Publishing makes a report available; sending is what
  makes someone read it. Name recipients by email (`recipientEmails`, 1–50) or
  pass `toAllOrgMembers`. Addresses are intersected with the organization's
  membership, so an address that matches no member is skipped rather than
  emailed — the response tells you `queued`, `skipped`, and exactly who
  received it, which is what to report back rather than a bare count.
  **Confirm with the user before sending.** Publishing notifies nobody;
  sending emails real people.
- **`archive_report`** hides a report reversibly — it leaves `list_reports`
  and its share URL stops rendering for readers, while the owner can still
  fetch it and restore it in the app. This is the cleanup default.
- **`delete_report`** is permanent: the report, its whole revision history and
  its URL are gone. Only reach for it when the user asked for permanent
  deletion in those terms; otherwise archive.

Archiving is not a status. An archived report keeps whatever `status` it had
and signals the archive through `archivedAt`.

## Common mistakes

- **Restating the `tldr` as a callout.** The field is already the opening
  deck. A `tldr` callout right after it shows the finding twice. Pick one.
- **Callout sprawl.** Past one or two, they stop signalling anything. Default
  to prose; promote only the through-line or a load-bearing caveat.
- **Pasting a quote into prose *and* embedding it as an insight block.** The
  block renders it canonically; framing prose goes before or after, never a
  copy of the words themselves.
- **Embedding an insight group where an insight belongs.** Chips and
  `insightId` take insight ids only — one thing one customer said. Insight
  group ids don't embed, and they're session-scoped handles that don't survive
  Format's re-clustering, so they must never be persisted into a report at
  all. Summarise the theme in prose, or chart its numbers as inline `data`.
  Passing one fails the create with the offending field named.
- **A table used as a list.** One column of bullets is a markdown list inside
  a TextBlock. Tables earn their weight comparing dimensions across subjects.
- **Blocks with no connecting prose.** Tables, charts and embeds back to back
  read like an export, not a report. A sentence or two of narrative between
  blocks keeps the argument moving — you're writing a report that uses
  evidence, not a feed of evidence.
- **A chart with more ceremony than story.** If the numbers don't have a
  shape, a sentence beats a chart.
- **Publishing without asking.** Publishing makes a report visible to the
  whole organization. Show the user the draft first unless they explicitly
  asked for a one-shot publish.

## Limits and rules

- Block ids are unique within the document; total blocks ≤ 200.
- Serialised document JSON ≤ 200 KB; `clientContext` ≤ 64 KB; `handoff`
  ≤ 100k characters. Image bytes never travel over MCP — they go to the
  presigned URL, capped at 10 MB.
- References are verified against the organization and **kind-strict**: chips
  and `insightId` take insight ids only. A mismatch is refused naming the
  field, and every bad entity mention is reported in one round trip naming the
  block and the tool that hands out valid ids.
- Referenced `imageId`s must be confirmed uploads in this organization.
- Reports are creator-only until published: `replace_report`,
  `publish_report`, `archive_report` and `delete_report` all work on your own
  authored reports, never on someone else's and never on the pipeline's
  scheduled reports.

## Principles

These are the defaults that make a report worth publishing. They're guidance,
not law — depart when the situation genuinely calls for it. Three stay firm:

- **Nothing on the page is invented.** Every claim traces to evidence you
  actually fetched. Format validates structure, never truth — if a number
  isn't real, nothing downstream will catch it.
- **The user decides what goes public.** Draft by default; publish and send
  are explicit, confirmed steps.
- **Never modify what you didn't write.** Revise your own drafts freely;
  another author's report and the pipeline's scheduled reports are not yours
  to edit, archive or delete.
- **A report is an argument, not a container.** The blocks are in service of a
  through-line. If you can't say in one sentence what the report claims, it
  isn't ready to publish — that sentence is the `tldr`.
- **Write the handoff.** Six weeks later, the questions are "which records
  drove that number?" and "what did you rule out?" The handoff is the only
  place those answers survive.
