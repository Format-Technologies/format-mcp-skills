---
name: format-report-authoring
description: "Use when you are about to write a report into Format with create_report or replace_report — the craft guide for authoring one well. Read it BEFORE your first authoring write, not after. Covers the block-tree document model and which block does which job, the entity-mention law (companies, people and records are linked chips, never plain text), evidence discipline for quoting real customers, the cover fields (title, scope, conclusion, tldr), the reach-bar chart convention, the image upload handshake, and the draft → publish → send lifecycle. Triggers on 'write this up as a report', 'put this in Format as a report', 'create a report from these findings', and on any revision of a report you authored."
metadata:
  display_order: 120
  version: '1.0.0'
  title: Report Authoring
  personas: [product, research, leadership]
  related: [format-analysis]
  prompts:
    - "Write these findings up as a report in Format."
    - "Create a Format report from this analysis, with real quotes and linked companies."
    - "Revise the report you authored — fold in the advisories and republish."
  image: card.jpg
  use_case: >-
    Turn findings you have already gathered into a real Format report —
    rendered, shareable, with playable insight audio and live links to the
    companies and people it names. This is the craft guide: what makes a
    Format report read like a report rather than a data dump, and how to
    use each block for the job it is good at.
  limitations: >-
    Does not do the research — bring findings you have already gathered.
    Authoring tools must be on your connection; if create_report is not in
    your tool list, your credential is read-scoped.
    It writes new reports you were asked for and revises reports you
    authored; it never edits or deletes anyone else's work.
---

# Report Authoring

You have decided to write a report. This is how to write a good one.

A Format report is not a document export. It is a live artifact: the quotes
still play their audio, the company and person names are chips whose hover
cards carry real context, and the share URL keeps working. Everything below
exists to make you use that, instead of writing a Word document into a JSON
field.

**Read `format-analysis` alongside this one** — it is the method for gathering
the evidence a report is written from, and this skill assumes what you bring is
already sound. If it is not installed, the Format skill gallery has it.

## The five laws

1. **Never write a name in plain text that could be a chip.** Companies,
   people and records are `{{company:<id>}}`, `{{person:<id>}}`,
   `{{record:<id>}}`. This is the single most common way an authored report
   comes out looking amateur.
2. **Every quote is a real quote, attributed.** You cite insights by id and
   let Format render them. You never write a quote you did not retrieve.
3. **Prose carries the argument; blocks carry the evidence.** Back-to-back
   tables and charts with no narrative between them read as an export.
4. **The first screen is the report.** Most readers never scroll. `title`,
   `scope` and `conclusion` have to work alone.
5. **Iterate in place.** `get_report` → revise → `replace_report`. Never
   create a second report to publish a revision.

## Before you write

Have these in hand. If you don't, go back and search — authoring is the last
step, not the research step.

- **The insights you will cite, with their ids**, gathered and checked the
  `format-analysis` way — which altitude to search at, and how to keep the
  numbers honest, is its job rather than this skill's.
- **The entity ids attached to them.** Every insight row carries `company.id`
  and `person.id`. Keep them as you gather — going back for them later is
  the step people skip, and skipping it is what produces a plaintext report.
- **Your through-line.** One sentence you could say out loud. If you can't,
  you are not ready to author; you have a pile of findings, not a report.
- **`orgId`**, if your connection can reach more than one organization.

## The document model

```
{ version: 1, blocks: Block[] }
```

Each block has a unique `id` (semantic — `"pricing-table"`, not `"block-7"`;
they anchor the contents rail and keep revision diffs readable) and a `type`:

| type | what it is |
| --- | --- |
| `section` | a heading plus child leaf blocks — one level only, sections never nest |
| `text` | markdown prose; the workhorse |
| `insight` | a full embedded insight: audio player, speaker, canonical quote |
| `table` | tabular comparison; cells are markdown-able and take chips |
| `chart` | bar / line / area from inline data |
| `callout` | a highlighted box for the through-line or a load-bearing caveat |
| `image` | a captioned figure, full-bleed cover, or gallery grid |

**Every block belongs to a section.** A leaf block at the top level renders as
unlabelled matter between the cover and the numbered sections, and the contents
rail cannot reach it. There is no such thing as an opening standfirst above the
first section — that is what `scope` and `conclusion` are for.

Sections: 3–6 is the sweet spot. `heading` is the full editorial headline and
may be sentence-length; `shortTitle` is a 2–4 word nav label (omit it when the
heading is already short — never make it a truncation); `summary` is a 1–3
sentence lede that frames the section without duplicating its first paragraph.
`level: 2` unless you genuinely need a sub-section.

## Entity mentions are the law

Format knows the companies and people in your org. When you name one, write the
mention. The reader gets a chip with a hover card — who this person is, their
role, the company's card — and the report stops being a wall of strings.

- `{{company:<id>}}` and `{{person:<id>}}` render Spotlight chips. They ignore
  display text; the chip renders the entity's own name.
- `{{record:<id>}}` renders a source citation. This one *does* take display
  text, and you should use it: `{{record:<id>|the November QBR}}` reads as part
  of the sentence where a bare citation interrupts it.
- `{{insight:<id>}}` renders an inline evidence chip — hover shows the quote,
  click opens the full insight.

The ids are already on the insights you cited (`company.id`, `person.id`). A
missing `person`/`company`, or a null id, means the entity was inferred rather
than matched — keep that one as plain text. Otherwise: chip it. Mentions work in text bodies, **table
cells**, and callout bodies. They do **not** work in a section's `summary` —
that field gets no markdown pass, so a chip there renders as a dead string and
nothing fails the write; keep summaries to plain prose. Everywhere else they
are verified at write time, and a bad id fails the write naming the block — so
a mention that survives is a mention that resolves.

### The canonical mistake

A table of companies, in plain text. Every cell in that first column is an
entity Format knows, rendered as a dead string.

**Wrong** — six links thrown away, and a "Who said it" column that a chip would
carry for free:

```json
{ "id": "asks", "type": "table",
  "headers": ["Company", "Ask", "Who said it"],
  "rows": [
    { "cells": ["Northwind Logistics", "Bulk CSV export", "Priya Raman, Head of Ops"] },
    { "cells": ["Halcyon Health", "SSO via Okta", "Dan Okafor, IT lead"] },
    { "cells": ["Meridian Freight", "Webhook retries", "Sam Iyer, Eng manager"] }
  ]
}
```

**Right** — same table, every subject live, and the evidence one hover away:

```json
{ "id": "asks", "type": "table",
  "caption": "What each account asked for, last 30 days",
  "headers": ["Company", "Ask", "Who", "Source"],
  "rows": [
    { "cells": ["{{company:cmp_nw}}", "Bulk CSV export", "{{person:per_priya}}", "{{insight:ins_001}}"] },
    { "cells": ["{{company:cmp_hh}}", "SSO via Okta",    "{{person:per_dan}}",   "{{insight:ins_002}}"] },
    { "cells": ["{{company:cmp_mf}}", "Webhook retries", "{{person:per_sam}}",   "{{insight:ins_003}}"] }
  ]
}
```

The same rule applies in prose:

- **Wrong:** "Northwind Logistics and Halcyon Health both raised export limits."
- **Right:** "{{company:cmp_nw}} and {{company:cmp_hh}} both raised export limits."

## Evidence discipline

**Quote by reference, never by transcription.** You cite an insight id; Format
renders the canonical quote with its speaker and its audio. If you also paste
the words into your prose, the moment plays twice and the two copies drift.

**Wrong** — the quote appears in prose *and* in the block:

```json
{ "id": "x", "type": "text", "body": "Priya at Northwind said \"the rollout was rough because nobody knew which channel to ask in\"" }
{ "id": "y", "type": "insight", "insightId": "ins_004" }
```

**Right** — prose frames, block delivers:

```json
{ "id": "intro", "type": "text", "body": "Onboarding friction came up more than any other theme. The clearest articulation came from {{person:per_priya}}, mid-rollout:" }
{ "id": "quote", "type": "insight", "insightId": "ins_004" }
{ "id": "after", "type": "text", "body": "The same pattern — small fixes blocking real adoption — repeats across three other accounts." }
```

**Never invent a quote, a name, or a number.** Not as a placeholder, not as an
illustration, not "styled to look finished" while you go find the real one. An
authored report is indistinguishable from a researched one once it is
published, and a plausible fabricated quote is the worst thing this surface can
produce. If you don't have the evidence, write less report.

**Chip or embed?** The full `insight` block is the heaviest thing on the page —
roughly a screenful with its audio player — and its weight fades with
repetition. Three in a row are a wall of cards.

- The one quote that *is* the point → `insight` block.
- Supporting evidence inside a sentence → `{{insight:<id>}}` chip.
- Ten findings at once → a table with a chip column, not ten embeds.

**Insight ids only.** Chips and `insightId` take insights — one thing one
customer said. Insight-*group* ids are not embeddable: summarise the theme in
prose, or plot its numbers. Passing a group id fails the write.

## Choosing the block

| the job | the block |
| --- | --- |
| carry the argument | `text` |
| one quote that is the point | `insight` |
| same dimension across several subjects | `table` |
| a trend, or a comparison worth seeing | `chart` |
| the through-line, or one load-bearing caveat | `callout` |
| a figure the reader needs to see | `image` |
| a list | a markdown list **inside** `text` — not a table |

**Tables** compare. One column of bullets is a list that wandered into a table.
Rows must follow the header order.

**Charts** need a visual story. A number with no shape is a sentence. One chart
per report is plenty; if a claim isn't better *seen*, write it.

**Callouts** are rationed. One, maybe two. A third means the content belongs in
prose — scattered callouts read as nervous, not authoritative. Never use the
`tldr` variant: `conclusion` already owns the lower half of the first screen,
and a `tldr` callout says it again, immediately. Use `highlight` for a single
mid-document claim worth singling out; `info` / `warning` for the caveat a
reader needs in order to interpret the rest. One honest warning at the end is
often the most useful block in a report.

## Reach bars: how to show demand

When you show how many accounts care about something, **distinct customers are
the bar** and mentions ride along as a quiet annotation. Mentions is almost
always the bigger number, so plotting both as competing bars buries the breadth
you actually wanted to lead with.

**Wrong** — two series, and the loud one wins:

```json
{ "id": "reach", "type": "chart", "chartType": "bar",
  "data": [
    { "x": "Audience-targeted segmentation", "series": { "customers": 10, "mentions": 27 } },
    { "x": "Report delivery flexibility",    "series": { "customers": 9,  "mentions": 15 } }
  ]
}
```

**Right** — one bar per theme, mentions annotated, ranked by reach:

```json
{ "id": "reach", "type": "chart", "chartType": "bar",
  "title": "Report-customization themes, by reach",
  "annotationSeries": ["mentions"],
  "data": [
    { "x": "Audience-targeted segmentation", "series": { "customers": 10, "mentions": 27 } },
    { "x": "Report delivery flexibility",    "series": { "customers": 9,  "mentions": 15 } },
    { "x": "Self-serve onboarding",          "series": { "customers": 5,  "mentions": 10 } }
  ]
}
```

The renderer draws the bar from the plotted series and prints a muted
`· 27 mentions` at its end. `annotationSeries` is bar-only, must name keys
present in `series`, and must leave at least one series plotted.

Bars orient themselves: with more than ~6 categories, or long labels like theme
and account names, the renderer lays them out horizontally so every label stays
readable. Author a plain bar block and let it.

Counts trace to real insights. Do not add lifecycle state — "committed",
"planned", "won't do" — to a reach chart; nothing in the evidence supports it.

## The cover

Write these last, when you know what the report says. Each is a paragraph, not
a section. The cover already prints the window, the date, the author and the
counts — never repeat them.

**title** — names the QUESTION, not the finding. Title Case, ten words or
fewer, no em dashes.
- Right: "What Decides Whether a New Account Survives Onboarding"
- Wrong: "Onboarding Is Why New Accounts Churn" — that's a verdict; it belongs
  in `conclusion`, and putting it here makes the first screen say one thing
  twice.
- Wrong: "Q4 Customer Feedback Summary" — filler; names no subject.

**scope** — two or three lines on what you looked at and what the finding rests
on. Say "the last quarter" if the period matters; never the dates.
- Right: "Calls and support tickets, wherever a customer described getting set
  up or getting stuck."
- Wrong: "Twenty-four conversations from 13–24 June." — the cover prints both.

**conclusion** — the most important thing you write, alone on the lower half of
the first screen. Two lines, a blank line, then up to three grounding it.
- Right: "Nothing here is a complaint about the product. Everyone who got their
  data in describes days collapsing into minutes; everyone who stalled never
  saw any data at all. The gap is the first hour."
- Wrong: "Customers had both positive and negative feedback across several
  areas." — true of every report ever written.

**tldr** — optional, and used *outside* the report: cards, emails, Slack. Not
rendered on the page. May restate the conclusion, shorter.
- Right: "Customers don't reject pricing — they reject pricing they can't
  explain to their boss."
- Wrong: "This report explores customer feedback on pricing."

## Images

`image` blocks come in `single` (reading-width figure), `cover` (full-bleed
hero) and `gallery` (2+ tiles). Slots reference an `imageId` — and there are
exactly two ways to get one.

**If you hold the bytes** (filesystem and shell access):

1. `upload_report_image({ contentType: "image/png" })` → `{ imageId, uploadUrl }`
2. PUT the bytes yourself, with a matching Content-Type:
   `curl -T chart.png -H "Content-Type: image/png" "<uploadUrl>"`
3. `confirm_report_image({ imageId })` → the image is ready and referenceable
4. Reference `imageId` in the block

**If you do not** — and you usually do not; a user pasting an image into chat
does not give you bytes you can re-emit — **author a placeholder**. Omit
`imageId`, write the `caption` (it tells both the reader and the uploader what
belongs there) and an `aspect` hint so the layout reads correctly while the
slot is empty. Then tell the user to click the placeholder in the report to
upload it. This is a first-class outcome, not a degraded one.

Never inline base64 or data-URIs, and never point at an external image URL.
Blocks take confirmed `imageId`s only. `single` and `cover` need exactly one
slot; `gallery` needs two or more.

## The iteration loop

There are no per-block edits. `document` is a **whole-tree write**: what you
send is the report, and anything you omit is deleted.

```
create_report  →  get_report  →  revise the tree  →  replace_report  →  publish_report
```

So when revising a report you did not just compose in this conversation, **read
it back first** with `get_report`. Editing from memory silently drops every
block you forgot.

`replace_report` takes only the fields you want changed; omitted fields stay
as they are. Each call writes a new revision and keeps the previous one in
history — one URL, clean history. Do **not** create a second report to publish
a revision. Same-title re-creates inside 15 minutes are rejected with a pointer
to the original; a fresh `idempotencyKey` is the deliberate override if you
really did mean a new report.

Two useful extras on the write:

- `validateOnly: true` checks the whole document — refs, mentions, caps —
  without persisting. Worth it before a large first create.
- `handoff` carries the research behind the report as markdown: what you
  searched, what you ruled out, what is still open. It is not rendered; it is
  what a reader gets when they choose "Continue in your AI tool", and it is
  report-level, so later document edits leave it alone. Leave one whenever the
  analysis was non-trivial.

## Lifecycle

**Born a draft.** `create_report` returns a report only *you* can see — the
share URL renders for its creator and nobody else. That is the review window;
use it.

**Publishing is explicit.** `publish_report({ id })` puts it on the whole org's
Reports page. `create_report({ publish: true })` is the one-shot version — use
it only when the user asked for exactly that. Publishing twice is a no-op.
Retracting to draft is an in-app action for the owner, not something you do.

**Sending is separate, and members-only.** `send_report` emails a *published*
report to people in the org (`recipientEmails`, up to 50, or
`toAllOrgMembers`). It cannot reach anyone outside the organization — a
non-member address is skipped. The response names who was actually emailed;
report those names back rather than the addresses you asked for.

**Archive ≠ delete.** `archive_report` hides a report and keeps it restorable
from the app — the safe default for cleanup. `delete_report` is permanent,
takes the revision history with it, kills the share URL, and deleting the last
report of a series deletes the series too. Prefer archive unless the user
explicitly wants it gone for good.

**Series** group editions under one name: `create_series` promotes a report
into the first edition, `add_report_to_series` / `remove_report_from_series`
move others in and out, `update_series` renames. Pass `seriesId` on create to
write straight into one.

**What you may write.** New reports the user asked for, and revisions of
reports you authored. Format's scheduled pipeline editions are not yours to
edit, archive or delete, and neither is anyone else's authored report — the
tools enforce it, but do not go looking.

## Advisories

A successful write may come back with `advisories` — non-blocking notes from
the renderer's side of the page, like a run of insight embeds that will land as
a wall of cards. You cannot see the rendered layout; this is the only glance
you get at it. They never fail anything. Read them, apply what you agree with
via `replace_report`, and leave the rest.

## Before you call create_report

- [ ] Every company, person and record named in prose or in a table cell is a
      mention, not a string
- [ ] Every quote is a real cited insight — none written by you
- [ ] No quote appears both in prose and in an `insight` block
- [ ] 3–6 sections, and no leaf block stranded at the top level
- [ ] At most one or two callouts, none of them `tldr`
- [ ] Prose between the blocks — an argument, not a feed
- [ ] Reach charts plot customers, with mentions in `annotationSeries`
- [ ] `title` asks the question; `conclusion` answers it; neither repeats the
      other
- [ ] Block ids unique and semantic
- [ ] Within limits: ≤200 blocks, ≤200KB serialised document

Then create the draft, read it back, and only then publish.
