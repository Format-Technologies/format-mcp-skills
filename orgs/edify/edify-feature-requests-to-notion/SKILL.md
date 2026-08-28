---
name: edify-feature-requests-to-notion
description: Pulls customer feature requests from Format (Intercom, Fireflies and Kixie conversations) for a given period and appends them to the Feature Requests database on Edify's Notion Feature Requests page — one row per request with a one-line summary, date, customer and company linked to their Format profiles, product area tags, improvement-vs-new-feature type, major/minor scope, sentiment, CRM stage, and a link to the Format insight. Customers only; leads and prospects are filtered out via the HubSpot lifecycle stage. Use whenever the user asks to log, round up, sync, or write feature requests from Format into Notion, asks "what did customers ask for this week", or asks for the weekly/monthly feature request roundup. Trigger even if they only say "update the feature requests page" or "pull last week's requests into Notion".
metadata:
  display_order: 10
  title: Feature Requests to Notion for Edify
  personas: [product]
  image: card.png
  use_case: >-
    Every feature request customers raised on support tickets, chats and
    calls, logged weekly into the Notion database the product team already
    reviews — summarized to one line, tagged by product area, scope and
    sentiment, deduped against earlier runs, and linked back to the original
    conversation with playback.
  limitations: >-
    Appends to one Notion database on one page; it never creates tickets or
    edits the roadmap. Prospect requests are filtered out via the HubSpot
    lifecycle stage, so rows from companies not synced to the CRM land as
    "Unknown" for spot-checking rather than being dropped. Needs the Format
    and Notion MCP servers connected, and a one-time confirmation of the
    Notion page on the first run.
  prompts:
    - "Pull last week's feature requests into Notion."
    - "What did customers ask for this week? Log it to the feature requests database."
    - "Update the feature requests page for the last 7 days."
---

# Feature requests → Notion

Append the latest Feature Requests insights from Format to the **Feature
Requests database** on Edify's Notion **Feature Requests** page (under
Operations).

**Notion page ID:** `<notion-feature-requests-page-id>`
**Format topic:** `Feature Requests`
**Format org:** Edify (`org_cxuyfe28rn1spv8gfgjgyrmk`)

## If the page ID above is a placeholder

Resolve it once, interactively — never in a scheduled run (a scheduled run
that finds a placeholder should stop and report, not guess, because guessing
wrong here is how a second database gets created). Search the workspace
(`mcp__notion__notion-search`) for a "Feature Requests" page, show the user
what you found, and confirm the match before touching it — several pages can
share that name. If none exists, ask where to create it. Then write the
resolved ID back into this skill file, replacing the placeholder, so every
later run — especially the scheduled ones — is deterministic.

The database is the running log the product team reviews biweekly, filters
by theme, and connects to their other roadmapping tools. If the page also
holds a legacy markdown table from earlier manual runs, that table is the
archive — leave it alone.

## The database is a running log — always append, never replace

One database, growing over time. Every run adds pages (rows) to it. Never
create a second database, never delete or rewrite existing rows, never touch
the legacy table.

## 1. Settle the date range

If the user didn't name one, use the **last 7 days ending today** and say so in
your reply. Get today's date from `date -I` in bash rather than assuming.
"Last week" means the trailing 7 days unless they clearly mean the previous
calendar week.

## 2. Find the database — create it only on the first run

Fetch the page (`mcp__notion__notion-fetch` on the page ID) and look for the
database block. Grab its data source URL from the `<data-source url="...">`
tag.

If the fetch 404s, you're probably authenticated to the wrong Notion
workspace — fetch id `self` and check the workspace name before concluding the
page is gone.

If the page has no database yet, create it once with
`mcp__notion__notion-create-database`, parented on the page:

```sql
CREATE TABLE (
  "Feature request" TITLE,
  "Date" DATE,
  "Customer" RICH_TEXT,
  "Company" RICH_TEXT,
  "Product Area" MULTI_SELECT('COGS Reports':orange, 'Stocktaking':green, 'Ordering':blue, 'Deliveries':blue, 'Invoicing & Reconciliation':purple, 'Waste':brown, 'Suppliers':yellow, 'Reporting & Analytics':orange, 'Settings':gray, 'Integrations & API':pink, 'Other':gray),
  "Type" SELECT('Improvement':blue, 'New Feature':green),
  "Scope" SELECT('Major':red, 'Minor':gray),
  "Sentiment" SELECT('Frustrated':red, 'Neutral':gray, 'Positive':green),
  "CRM stage" SELECT('Customer':green, 'Unknown':yellow),
  "Week" RICH_TEXT,
  "Insight" URL
)
```

`create-database` parents the database as a full-page child, which renders on
the page as just a link. To make the rows visible on the page itself: create
an inline linked view with `mcp__notion__notion-create-view`
(`parent_page_id` = the page, table, sorted `Date` descending), then move the
database itself to the workspace level with `mcp__notion__notion-move-pages`.
The page then reads callout → table → run log. First run only — an existing
setup already has this, and the moved database keeps working as the linked
view's source.

The categorization scheme is the product team's: **Product Area** (which
feature of the platform the request relates to) and **Type** (improvement
to something that exists vs a new feature). Add an option to the Product
Area list here and in the database when requests clearly cluster in an area
none of them covers — don't force-fit into `Other`.

## 3. Read what's already logged

Two things before pulling anything:

1. **The most recent `Week` value**, so you know what's already covered. If
   your range overlaps one already logged, ask whether to skip or add only
   what's new.
2. **The set of insight URLs already in the database**, for dedupe — Format
   can re-surface an insight if a conversation is reprocessed, and duplicates
   are the main way this log goes wrong.

Get both with one query (`mcp__notion__notion-query-data-sources`, SQL mode):
`SELECT "Insight", "Week" FROM "collection://<data-source-id>"`. If SQL mode
is unavailable on the plan, fetch the data source and read the rows instead.

## 4. Pull the insights from Format

```
mcp__format__search_insights
  topicNames: ["Feature Requests"]
  dateRange: { from: "<YYYY-MM-DD>", to: "<YYYY-MM-DD>" }
  includeCompanyAttributes: true
  limit: 100
```

Notes that matter:

- **The response may overflow the tool result limit** and be written to a
  file. That's fine — parse the file with python/jq rather than reading it
  whole. Each insight has `id`, `text`, `person {id, name, source}`,
  `company {id, name, source}`, `record {title, sourceType}`, `timestamp`,
  `shareUrl`, `isAiRejected`, and (with the flag above) `companyAttributes`.
- **Drop rows where `isAiRejected` is true.** These are Format's
  low-confidence extractions. Count them — the count goes in the run log.
- If `hasMore` is true, page with `offset` until it isn't.
- Sources in this org are Intercom, Fireflies and **Kixie** (call recordings
  used by the business development team). Count the per-source split for the
  run log; don't assume the source list is fixed.

### Filter out leads and prospects

Fireflies and Kixie also record the business development team's prospect
calls, and the product team does not want prospect requests in this log.
The signal is the **`Lifecycle Stage`** company attribute (synced from
HubSpot, present on `companyAttributes` when the company is CRM-linked):

- Value is `customer` (compare case-insensitively) → **keep**, `CRM stage:
  Customer`.
- Value is anything else (`lead`, `opportunity`, …) → **drop**. Count the
  drops for the run log.
- Attribute missing (company unlinked or nothing synced) → **keep** but set
  `CRM stage: Unknown`, so the product team can spot-check rather than
  silently losing real customers. Mention these rows in your reply.

Filter locally rather than with `attributeFilters` — local filtering is
robust to value-spelling differences and gives you exact excluded counts.

## 5. Write the summaries yourself

The `text` field is the customer's verbatim words and is usually a paragraph.
Compress each to **one line, 8–20 words, stating the capability being asked
for** — not the complaint behind it. "Sort and filter lists by value, highest
to lowest", not "user was frustrated by having to scroll".

Keep the customer's own framing where it's specific (product names, tier
numbers, named integrations). Don't invent detail the quote doesn't
support — if a quote is vague about what system it refers to, keep the
summary vague too.

## 6. Tag every row

Four judgment calls per request, all grounded in the quote alone:

- **Product Area** — one or two options from the multi-select, never more.
  If none fits, use `Other` rather than stretching a label.
- **Type** — `Improvement` when the ask changes something the platform
  already does ("show the requested delivery date, not next day");
  `New Feature` when it asks for a capability that doesn't exist ("request a
  credit note from the matching screen"). When the quote doesn't make clear
  whether the capability exists, default to `Improvement`.
- **Scope** — `Major` for platform-level logic that would apply across
  customers; `Minor` for asks specific to one customer's setup, supplier, or
  data (e.g. "re-pull this data for one named site" is Minor; "request credit
  notes from the matching screen" is Major).
- **Sentiment** — `Frustrated` when the quote carries irritation or blocked
  work, `Positive` when the ask rides on praise, `Neutral` otherwise. Most
  rows are Neutral; don't manufacture drama.

## 7. Handle imperfect attribution honestly

- `person` absent entirely (common on Fireflies transcripts with no linked
  participants) → **"Unattributed speaker"**. Don't guess from the transcript.
- `person.source` or `company.source` is `"inferred"` → the name was read out
  of the conversation, not matched to the CRM. Use it, but if the inferred
  company is a truncation of a known one ("Harbour" vs "Harbour Coffee Co."),
  normalise to the full name. Inferred companies have no lifecycle stage, so
  they land as `CRM stage: Unknown`.
- Company resolves to a vendor rather than a customer (e.g. `Intercom`,
  `intercom.io` — an artifact of how the contact was synced) → write
  **"Unconfirmed — Intercom contact"** rather than the vendor name.

Mention any of these in your reply so nobody treats the database as clean CRM
data. The standing caveat lives in the callout at the top of the page; don't
add another one per run. Its canonical text (create it on first run; if the
page's callout says something materially different, align it to this):

> 💡 **How to read this database:** Rows are pulled automatically from
> customer conversations in Format (Intercom, Fireflies and Kixie). People
> and companies are matched to the CRM where possible; rows marked
> `CRM stage: Unknown`, "Unattributed speaker", or an inferred company name
> couldn't be fully matched and deserve a spot-check. Each row links to the
> original insight with playback.

## 8. Append the rows

One `mcp__notion__notion-create-pages` call, parented on the data source
(`data_source_id`), one page per request, oldest first. Properties per page:

```
"Feature request": "<one-line summary>"        (the title)
"date:Date:start": "2026-08-26"
"date:Date:is_datetime": 0
"Customer": "[<person.name>](https://useformat.ai/app/data/people/<person.id>)"
"Company": "[<company.name>](https://useformat.ai/app/data/companies/<company.id>)"
"Product Area": ["Invoicing & Reconciliation"]
"Type": "New Feature"
"Scope": "Major"
"Sentiment": "Neutral"
"CRM stage": "Customer"
"Week": "22–28 Aug 2026"
"Insight": "<shareUrl verbatim>"
```

Text properties take inline rich text — escape `\ * ~ ` $ [ ] < > { } | ^`,
and watch for pipes and angle brackets in customer quotes.

**Customer and Company are markdown links into the Format app**, using the
`person.id` and `company.id` from the insight (`/app/data/people/<id>` and
`/app/data/companies/<id>`). When there is no id to link — an unattributed
speaker, or an inferred person or company — write the plain name instead.

If the period covers no requests at all, add nothing to the database but
still write the run log line saying so.

## 9. Write the run log line

The page has a **Run log** section (a heading with a bulleted list) below
the database, at the bottom of the page — create it on first run if missing,
and move it below the table if a legacy page still has it above. Append one
bullet per run, newest last:

```
- **22–28 Aug 2026** — 22 added (10 companies; 11 Fireflies, 9 Intercom,
  2 Kixie). Excluded: 2 low-confidence, 3 from leads/prospects.
```

This replaces the shaded period rows the legacy table used.

## 10. Verify

Re-query the data source and confirm:

- the row count grew by exactly the number of kept requests
- no insight URL appears twice
- the new rows carry the right `Week` value

Then re-fetch the page and confirm the run log gained exactly one bullet.

## Views for the product team

The default view should be useful at biweekly review: filtered to
`CRM stage: Customer`, grouped by `Product Area`, sorted `Date` descending. Set it
up with `mcp__notion__notion-create-view` on the first run; after that the
team owns the views — never modify or delete views they've made.

## Setting it up as a recurring job

**The skill must be saved in the same Claude client that runs the schedule.**
A scheduled run fires in a fresh session of whichever client owns the
schedule; if the skill isn't in that client's skills list, the run fails.
Save the skill, confirm it appears under skills in that client, then
schedule, and test with a near-term run (manual or hourly) before trusting
the weekly cadence.

The schedule prompt must be standalone — each firing starts a fresh session —
so it should name this skill and say "the last 7 days". In Claude Code, use
`mcp__claude-code-remote__create_trigger` (not the local cron tools); a
Monday 09:00 London run is `0 8 * * 1` in UTC during BST. In Claude desktop,
use the schedules UI.
