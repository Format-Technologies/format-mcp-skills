---
name: format-roadmap-check
description: "Use when a product manager or leader wants to check a roadmap against real customer evidence using Format MCP — answering 'are customers asking for what we're building?' and the inverse, 'what are customers asking for that we're not building?'. Canonical invocation: 'using the Format MCP and the format-roadmap-check skill, check this roadmap' followed by a pasted list of roadmap items or a reference to a tracker project/epic. Also triggers on 'validate this roadmap against customer feedback', 'is there evidence for these roadmap items', 'what are customers asking for that isn't on the roadmap', 'roadmap evidence check', 'gap analysis on our roadmap'. Produces an evidence board: per-item customer evidence with links to every quote, plus the demand themes no roadmap item covers. It presents evidence and context rather than scoring items or recommending what to build or cut."
metadata:
  display_order: 30
  title: Roadmap Check
  personas: [product, leadership]
  image: card.jpg
  related: [format-ticket-research]
  use_case: >-
    Hold your roadmap up against what customers have actually said. Paste a
    roadmap (or point at a tracker project) and get an evidence board: what
    customers have said about each item with links to every supporting quote,
    and the things they keep raising that map to nothing you're building.
  limitations: >-
    Presents evidence; the conclusions are yours — it deliberately does not
    score items or rank the roadmap. Depth per item is survey-level; use the
    Ticket Research skill for a deep dive on one item. Quality depends on
    conversation coverage in Format and on which topics the workspace listens
    for; the board tells you when either is the limiting factor.
  prompts:
    - "Using the Format MCP and the format-roadmap-check skill, check this roadmap: [paste roadmap items]"
    - "Are customers actually asking for what's on our Q3 roadmap? Build me the evidence board as an HTML page."
    - "What are customers raising that maps to nothing on this roadmap? [paste roadmap]"
---

# Format Roadmap Check

## What this skill does

Given a roadmap — a pasted list of items, a document, or a project/epic fetched from a connected tracker — this skill researches what customers have actually said about each item and produces an **evidence board** with two halves:

1. **Roadmap vs. evidence** — for every item, what customers have said about the need behind it: the asks in customer language, who raised them and when, verbatim quotes, and a link to every piece of supporting evidence
2. **Unbuilt demand** — the things customers keep raising that map to **no** roadmap item

It presents evidence and the context needed to weigh it, and deliberately stops short of scoring items, grading demand, ranking the roadmap, or recommending building or cutting anything — whether the evidence is compelling depends on things only the reader can judge: capture quality, how much customers discuss this area in general, strategy, and what else competes for the team's time. The board's job is to make the evidence so legible that the reader's own conclusion is easy.

## When to use it

- Roadmap or quarter planning: "is what we've planned grounded in what customers say?"
- A leadership review asks for customer evidence behind the plan
- Periodic sanity check: "what are customers asking for that we're not building?"

This skill is survey depth across many items. Deep research on a single ticket or feature is a different job — see "Related skills" at the end for the hand-off.

## Inputs

**Required: the roadmap.** A pasted list of items (titles, ideally with a line of description each) is the baseline and always works. If a tracker MCP (Linear, Jira, Notion, etc.) is connected and the user points at a project, epic, milestone, or document, fetch the items from there — a tracker connection is a bonus, not a requirement; a pasted list alone is always enough.

**Optional — use when present, don't ask for:**

- **Existing context** — if a Format company-context document (the output of the `format-company-context` skill) is already in the conversation, use it to inform item reframing and search vocabulary; its absence blocks nothing.
- **Timeframe** — if the user names a window, use it. Otherwise the skill proposes one from the data (see Stage 1) rather than silently defaulting.
- **Segment scope** — the user may scope evidence to a customer segment (e.g. "active paying customers only"). `describe_org` lists the workspace's CRM `attributes`, each with its `label`, its `scope` (company or person), and the operators it actually accepts; pass matching `attributeFilters` (`[{ label, operator, value }]`) on every insight query. An unknown label is refused with the valid list rather than silently ignored, so a wrong guess is loud — but if the workspace has no such attribute, say so and proceed unscoped rather than substituting a weaker one.

## Stage 0 — Preflight: understand the evidence base

Two or three cheap calls before anything else. Their results calibrate the whole run and feed the board's context section.

1. **`describe_org()` — most of the preflight in one call.**
   - **Span and size:** `coverage.earliestRecordAt` → `latestRecordAt`, `recordCount`, `companyCount`. A freshly-ingested workspace may hold months of conversations imported on a single day; the window proposal in Stage 1 depends on knowing that.
   - **Format's own analysis:** `processing.hasGroups`. `true` means customers' words have been gathered into **insight groups** — themes running across many customers, each carrying how many distinct customers contributed. `false` means nothing here has been grouped at all: normal, not an error, and it points the run down the insight-only paths below. `processing.pendingInsightCount` says how far the groups lag the insights.
   - **Listening coverage:** `topics[]`, each with the standing question it asks and its `insightCount` and `groupCount`. Format only captures what its topics ask for; note which topics plausibly cover the roadmap's domains. Note also what product or audience the workspace's conversations appear to concern — the topic questions and early search hits usually make it obvious. If it visibly isn't the product the roadmap belongs to (wrong org selected, a demo workspace), raise that at the Stage 1 checkpoint: every empty row on the board would be an artifact of the mismatch, not of demand. If the connection can reach several workspaces, `list_organizations()` names them and every response echoes the `org` that answered.
   - **Company knowledge:** `attributes[]` — what the workspace knows about its companies beyond their names, each with the operators it accepts. Look especially for anything that separates prospects from customers (lifecycle stage, customer status, plan tier). An ask heard on an early prospecting call and the same ask from a paying customer are different evidence, and a board that silently blends them misleads. If such an attribute exists, bring it to the Stage 1 checkpoint as a scope choice. Finding nothing lifecycle-like is also normal — run unscoped and don't manufacture a segment from weaker signals.
2. **Volume and breadth:** `count_insights({ breakdownBy: "company" })` — total insight volume and how it spreads across companies. `count` is always the full total; `breakdown` covers only the insights that have a company to sit in, and `isBreakdownTruncated` is true when the buckets don't account for everything. That unattributed share belongs in the board's calibration block — a workspace where a quarter of the evidence is unattributed reads differently.
3. **Rate:** one more `count_insights` over a recent slice (via `dateRange`) to estimate roughly how many insights per month this workspace produces. Together with the span above, that is what the window proposal is earned from.

If the workspace holds very little data overall, say so — the board will be anecdotal — and let the user decide whether to continue; fold this into the Stage 1 checkpoint rather than making a separate stop. A preflight that finds a healthy workspace needs no announcement at all: its numbers belong in the board's calibration block, not in chat.

## Stage 1 — Parse the roadmap and propose the window (one checkpoint)

This skill makes exactly one stop before the long research run. Prepare three things and show them together:

**1. The parsed roadmap.** Normalize the input into a list of items. For each: the item title, and the customer problem behind it in one line of customer language (solution-speak → problem-speak, exactly as a customer would describe the pain). Flag items that look **internal** — infrastructure, tech debt, compliance, replatforming — where customer evidence wouldn't be expected even for worthwhile work. Internal items stay on the board but are marked so an empty evidence row reads as "not customer-facing," never as "nobody wants this."

**2. The timeframe proposal, earned from the data.** Propose a window and show the reasoning, derived from preflight:

- **With insight groups**, themes compress volume and already carry a first-seen/last-seen span, so windows of several months up to a year work well.
- **Without them**, the unit of work is the individual insight, so scale the window inversely to the monthly insight rate — wide enough to be representative, narrow enough that every candidate can still be honestly adjudicated. As illustrative calibration: a workspace producing thousands of insights a month points to a window of weeks; hundreds a month points to a few months; less than that, wider.

One boundary case overrides the heuristics: **if the corpus's date span is shorter than any window you'd propose, propose the full span and say so** — "everything here was captured within [span], so I'll use all of it." Rate math on a corpus like that produces nonsense, and the board's calibration block should then note that there is no date spread to read trends from.

State the proposal in one line with its reason — "Nothing grouped into themes here and roughly [N] insights/month, so I'll look at the last [window]; say the word to widen or narrow it" — and let the user override with a word. If the user already named a window, skip the proposal and respect it.

**3. The run's remaining settings, as defaults to redirect.** Two more choices shape the run, and the checkpoint is the cheap moment to settle them:

- **Destination** — chat (compact board); an HTML page or equivalent artifact; a **report published into Format**, when `create_report` is on the connection (report authoring is gated per organization, so it simply won't be there for every workspace) — the strongest option where it exists, because the board becomes a live, sharable Format artifact whose embedded insights stay clickable and playable; or a PDF, where the environment can produce one. Settle it now rather than at render time: by Stage 4 the user has waited through the whole run, and a destination question there costs a round-trip exactly when they want the answer. Pick the likeliest default from context (an explicit ask in the prompt wins; otherwise chat) and let them redirect with a word.
- **Scope** — if preflight found an attribute separating prospects from customers, surface it as a choice: scope the evidence, or run unscoped with the mix disclosed wherever it's material. Propose the reading the user's question implies — a check of "what customers are asking for" usually wants real customers foregrounded — but make the choice visible rather than silently blending the two populations. A user-named segment is resolved as described under Inputs.

**What the checkpoint is for.** The user has just handed over a roadmap and wants the research running; this stop exists to catch a misread cheaply — a wrongly reframed item, a bad window — not to demonstrate the preflight work. Include only what the user's answer could change: the reframed items, the window with its one-line reason, and the defaults chosen on their behalf. The preflight findings shaped those choices and will appear in the board's calibration block at the end — narrating them here means the user reads them twice, and the two or three things that actually need their eyes get buried. The exception is a preflight surprise that changes whether the user wants this run at all — a workspace/roadmap mismatch, a near-empty corpus, a compressed date span — which belongs front and center.

A checkpoint that reads in under a minute:

```
Parsed the roadmap into 9 items. Check the reframings — everything else
runs on the defaults below unless you redirect.

| # | Item | The need, as customers put it | Note |
[One row per item. Notes only where there's a judgment call: "internal —
evidence not expected", "researched as 4 sub-needs", "roadmap calls this
a bet — researching the underlying need". A note column where most rows
would say "customer-facing" is noise.]

Running with:
- **Window: last 6 months** (~4,800 of 6,500 insights; the workspace
  has insight groups, so months-scale reads well) — say the word for 3 or 12.
- **Scope: customers only** (the workspace's "lifecycle stage" attribute
  separates them from prospects) — or unscoped with the mix disclosed.
- **Destination: chat** — or an HTML page, a report in Format, or a PDF.
```

**Use the environment's question UI when there is one.** The settings are discrete choices, and some environments offer a structured way to ask — option pickers with a free-text escape, as in Claude's plan mode. Where such a tool is available, put window, scope, and destination through it, recommended option first, and keep the parsed-roadmap table in the message itself: reframings need free-form correction, not a picker. Where there is no such tool, prose like the example above does the job.

Take corrections (item framing, flags, window, scope, destination), then run without further questions.

## Stage 2 — Per-item research

**Run quietly.** The checkpoint was the conversation and the board is the deliverable; in between, the user is waiting, not reading along. A play-by-play in chat — "strong asks for X, now probing Y" — is the board leaking out early: every line of it gets read again, better organized, in the final render, and the environment already signals that work is happening. Speak mid-run only when something changes the run itself — a discovery that invalidates the checkpoint's framing, a workspace surprise, a blocker — and at most a line at a genuine seam (crossing from the per-item half to unbuilt demand), not per item or per query.

**Distill as you go.** A long roadmap multiplied by multi-round searches produces more raw results than one session can comfortably carry. After finishing each item, reduce it to exactly what the board needs — the need groups, their company counts and date spread, the one or two strongest quotes, the links — and research the next item against that summary, not against earlier items' raw search results. On a very large roadmap (roughly fifteen-plus items at this depth), say so at the checkpoint and propose splitting the run rather than degrading every item to fit.

For each customer-facing item, run a compact version of the iterative research loop (the Ticket Research skill runs the same loop at full depth):

1. **Poke:** search with a handful of probes spanning solution language and problem language — `search_insights({ semanticQuery: "<probe>" })` plus a `keywordSearch` pass for terms semantic search ranks poorly (product names, file formats, integration names). Keyword terms are OR'd together — pairing a precise term with a generic one ("Salesforce", "CRM") drowns the precise one, so probe precise terms separately or expect to filter the hits. Apply the agreed `dateRange` and any `attributeFilters` to every evidence query. Keep evidence searches unscoped by topic: `describe_org` diagnoses what the workspace listens for, but every insight sits under exactly one topic, so scoping to the ones you judged relevant silently drops everything that landed under a topic you didn't pick — and the roadmap's vocabulary is rarely the one the extraction used. Where the workspace has insight groups, run `search_insight_groups` over the same territory too — a matching theme is both confirmation the need exists at scale and a direct route to its evidence: take the group's `id` and call `search_insights({ supportingGroupId: "<id>" })`, which returns every insight gathered under it, however deep. Groups take the same filters (`topicNames`, `keywordSearch`, `dateRange`, `companyIds`, `attributeFilters`) but **not** `semanticQuery`, which searches individual insights; passing it fails the call rather than being ignored. Group ids are handles for this conversation only and do not survive re-clustering, so never carry one into the board or a saved artifact.
2. **Learn the language:** extract how customers actually phrase this need from the first round's hits, re-search with the learned vocabulary, and call `find_similar_insights({ insightId })` on strong hits to reach insights that belong near them — through a shared insight group where the workspace is clustered, by wording where it isn't. At survey depth, a round or two past the initial poke is usually enough — stop when a round adds nothing new.
3. **Adjudicate strictly.** Semantic similarity is not demand. Bucket every candidate: **direct ask** (explicitly requests the capability), **implied need** (describes pain the item would resolve), **adjacent** (same area, different need — discard), **counter-evidence** (wants the opposite, or describes the item's approach as a problem — keep, shown separately). Judge the words themselves; Format publishes no quality verdict on an insight, and there is none to defer to.
4. **Flag certainty.** Mark each accepted insight **clear** or **needs context**. For needs-context insights, `get_insight({ insightId })` is the cheap first move — it returns the same insight with its `context` (the extraction's summary of the surrounding conversation), the `groups` it belongs to, and `followUp` (what was said next). When that still doesn't settle it, fetch the whole conversation with `get_record({ recordId })` and read the surrounding exchange — then confirm or discard. At survey depth, deep-dive only where the resolution would change that item's picture. Anything still ambiguous is shown as ambiguous — promoting it silently overstates the evidence.
5. **Quantify locally — and count moments, not rows.** The accepted insights carry `company`, `person`, `record` and `timestamp` — compute distinct companies, the date spread, and the latest mention from what's already in hand rather than issuing more queries. Three corrections matter for honest numbers: **(a)** Format extracts insights per topic, so one customer statement can exist as several near-identical rows — **dedupe on `record.id`**: insights sharing a record that restate the same ask are one mention, and a record counts more than once only when it genuinely contains distinct asks (different speakers or different needs in the same conversation). **(b)** Company attribution can be partial — `company.source` is `linked` when Format knows the customer and `inferred` when the extraction only read a name out of the conversation, and an inferred one has a `null` id and can carry spelling variants — so count companies by normalized name, and disclose how much of the item's evidence is unattributed or inferred when it's material. **(c)** When the workspace distinguishes prospects from customers and the run is unscoped, count them separately — "6 companies" where five are early-stage prospects is a materially different fact than six paying customers, and the board should say which it is. And where an insight group backs an item, its `customerCount` ranks the item against its peers but must never be added to another group's: nested themes count the same customer more than once.

**When an item comes up empty,** name the most likely cause — they mean opposite things:

- **Internal item** — evidence wasn't expected; the flag from Stage 1 already says so.
- **Outside the window** — before claiming silence, run one `count_insights` for the item's vocabulary over a wider range (skip this when the window already covers the full corpus). If older evidence exists, say "no mentions in the last [window], though older mentions exist" with a link path to them. An empty result also names its own cause: `emptyReason` is `filtered_out` when the org has data your filter missed, `no_groups_yet` when nothing has been grouped into themes, and `empty_org` when there is no customer data at all — three very different findings.
- **Extraction gap** — no topic listens for this domain, so Format may never have captured it. Suggest that the workspace could add a topic for the area (a suggestion only — creating topics isn't this skill's job).
- **Workspace mismatch** — the conversations in this workspace concern a different product or audience than the roadmap (flagged at preflight). Then silence says nothing about demand, and the board should say so rather than reporting the items as quiet.
- **Genuinely quiet** — coverage is healthy, a relevant topic exists, the workspace matches the roadmap's product, and customers still aren't raising it. Report the silence as a fact, not a verdict.

## Stage 3 — Unbuilt demand (the inverse question)

Now flip the direction: what are customers raising that maps to nothing on the roadmap?

**With insight groups:** `search_insight_groups({ dateRange, orderBy: "demand", minCustomerCount: 2 })` — `minCustomerCount` exists for exactly this, and `orderBy: "demand"` puts the widest-reaching themes first. Match each theme against the roadmap items — a theme "maps" to an item when the item would plausibly resolve it; be generous toward the roadmap so the unbuilt list isn't padded with stretch mismatches. Generous means crediting plausible *resolution* — not direction-reversed or sibling needs (a bulk-*import* ask does not map to a bulk-*export* item; resolving one does nothing for the other). A need Stage 2 discarded as adjacent to some item belongs here if customers keep raising it. What remains unmatched is the unbuilt-demand list: present each with its `customerCount`, date spread, one representative insight (`search_insights({ supportingGroupId })` fetches the words), and links to its evidence.

Two properties of that page to hold onto: it can come back **shorter than `limit`**, because where themes nest it carries the broadest of each nest rather than both — so `count` is what came back and `hasMore` is whether there was more. And paging deep can resurface a narrower restatement of a theme already shown; narrow the filter rather than paging past the first page or two.

**Without insight groups,** this direction is inherently weaker — there is no theme census to compare against. Use the best available fallback: `count_insights({ dateRange, breakdownBy: "topic" })` over the window to find where the conversation volume concentrates, sample insights from the heaviest areas, and synthesize the recurring asks yourself. Every insight has a topic, so these buckets account for all of them — the blind spot isn't a missing bucket, it's that a domain no topic ever asked about produces no insights to bucket. Topic-volume sampling reads only what the topics were asked to hear, and the board should say so. Label this section clearly as a lower-confidence sketch ("synthesized from a sample, not from Format's own theme analysis") so it is read accordingly — and still include it; a labelled sketch beats silence.

## Stage 4 — Render the evidence board

Render to the destination settled at the checkpoint:

- **Chat** — the compact board, as markdown.
- **HTML page** — the full board: as an artifact where the environment supports them, otherwise a saved `.html` file. Every evidence link should be a real, working link into Format — on a page this polished, a dead link is worse than none.
- **A report in Format** — the full board as a live Format artifact, composed with `create_report`: the board as a `table` block, the strongest insight per item embedded as an `insight` block, remaining citations as inline `{{insight:<id>}}` chips inside the prose — so every count stays clickable at the source — and the calibration block as a closing section. The opener becomes the report's `tldr`. A report is born a draft only you can open; `publish_report` is the separate step that makes it visible to the whole organization. Share the `shareUrl` in chat alongside a two-line summary. If `create_report` isn't on the connection at all, report authoring is closed for this organization — fall back to one of the destinations above.
- **PDF** — where the environment can produce one: the HTML page's content, laid out for print.

**Open by setting the stage.** The board often lands in front of someone who wasn't in the conversation — pasted into Slack, shared as a link, rediscovered weeks later. So don't drop a cold reader straight into rows and quotes: open with a short plain paragraph that says what they're looking at — the question being answered (which roadmap, checked against what evidence), the period the evidence covers, and the main finding, stated as neutral fact. Two or three sentences, not a section. In a Format report, this opener is the `tldr`.

The board, in reading order (identical content in every destination):

```
# Roadmap evidence check
[The stage-setting opener — question, period, finding, as facts not
judgment: "The Q3 roadmap's 12 items, checked against what customers
said in conversations from Dec 2025 to Jun 2026. Evidence found for 7
of the 12; 3 items are internal, where none was expected; 4 recurring
customer asks map to no roadmap item."]

## The board
| Roadmap item | The need, as customers put it | Companies | Mentions | Latest | Strongest quote (one line) |
[One row per item, customer-facing items sorted by evidence volume,
internal items grouped at the bottom marked "internal — evidence not
expected". Sorting is presentation of fact, not a grade. Each row links
to its evidence section below. Empty rows carry their cause in place of
a quote: "outside window — older mentions exist" / "extraction gap" /
"no mentions found".]

## Evidence by item
### [Item]
[The asks grouped by distinct need when an item drew more than one. Per
group: companies and date spread, then at most 2 verbatim quotes — speaker,
role, company, date, source link — then one line linking ALL remaining
evidence: "all N quotes: [links or the search that reproduces them]".
Counter-evidence in its own marked sub-block. Ambiguous-after-deep-dive
insights listed as ambiguous. Omit items with nothing to show beyond what
the board row already says.]

## What customers raise that maps to no roadmap item
[The unbuilt-demand list: each entry with customer count, date spread, one
representative insight, links to all evidence. In the no-groups fallback,
open with the lower-confidence label.]

## Read this with
[The calibration block — neutral facts the reader needs to weigh the above:
window used and why — and, when the evidence found clusters much narrower
than that window, the span it actually covers; total insights and companies
in the window vs. the whole workspace, including the unattributed share; the corpus's date span
(and that trends are unreadable if it's compressed); whether insight
groups exist (and that the unbuilt section is a sketch if not); which
roadmap domains no topic listens for; any workspace/roadmap mismatch; any
segment scope applied — or, when the workspace can tell prospects from
customers and the run was unscoped, the mix.]
```

Verbosity is the enemy of an evidence board. The table carries the overview; the evidence sections carry depth **through links, not bulk** — at most two insights quoted inline per group, everything else linked. Omit empty sections rather than printing empty headings. Richer destinations may add layout — the HTML page can make the table the centerpiece with collapsible evidence sections; the report swaps links for embedded insights — not extra prose.

## Principles

These are the defaults that make the board trustworthy. They're guidance, not law — depart when the situation genuinely calls for it, and say so when you do. The two exceptions that stay firm: quotes are never fabricated, and nothing already in Format is modified or deleted — the only write is the report the user chose as the destination.

- **Quotes are verbatim and cited** — speaker, company, date, and the insight's `shareUrl`. The board's authority rests entirely on them being real; paraphrase belongs outside quotation marks.
- **The reader concludes.** Counts, dates, and quotes are facts; adjectives about them — scores, strong/weak labels, rankings, build/cut recommendations — are judgments that depend on strategy and constraints only the reader knows.
- **Counts stay clickable.** A number on the board ("6 companies") earns trust by leading to the evidence behind it — each insight's `shareUrl` where they exist; in chat, a described query that reproduces the set ("`search_insights` for X over the same window") does the job when there are too many to link individually.
- **Absence gets explained, not weaponized.** An empty row names its likely cause — the causes point in opposite directions, and "no captured evidence" rendered as "customers don't want this" is the board's worst failure mode.
- **One checkpoint, then work.** The Stage 1 stop is the only planned interaction before rendering — every extra stop costs the user a round-trip while they're waiting for the board.
- **The window is visible.** Either the user named it or the skill proposed it with reasoning and the user saw it — the window changes what every number on the board means, so a reader weighing those numbers needs to know it was a deliberate choice.

## Related skills

For a deep dive on a single item — full research depth, derived requirements, an evidence page for one ticket — use **`format-ticket-research`** if it's available: suggest it by name when the user zooms into one item ("want me to run format-ticket-research on this one?"). If it isn't installed, don't dead-end: offer to do the deeper pass inline in this conversation, and mention that the skill exists in the Format skills gallery.

## How to prompt this skill

```
Using the Format MCP and the format-roadmap-check skill, check this roadmap:

- [Roadmap item]
- [Roadmap item]
- [Roadmap item]
...
```

### Example 1 — pasted roadmap, full run

User pastes nine Q-next items. The skill preflights silently (healthy volume, insight groups exist), parses the items, flags two as internal, and shows the checkpoint — a dozen lines, table included, with "last 6 months" reasoned in one line and chat as the default destination. User tweaks one item's framing and confirms. The skill researches the seven customer-facing items without narrating between queries, finds evidence for five, marks one "extraction gap" (no topic covers that domain) and one "genuinely quiet," then surfaces three multi-customer themes no item covers. Board delivered in chat; user then asks for the HTML page; same content, rendered as a page.

### Example 2 — tracker project in, Format report out

User: "Check the 'Q3 Platform' project against customer evidence." A tracker MCP is connected, so the skill fetches the project's items from it. `create_report` is on the Format connection, so the checkpoint proposes a report in Format as the destination and the user takes it. After the run, the board is composed as a report — the strongest insight per item embedded as an insight block, remaining citations as inline chips — published, and the user gets the share URL plus a two-line summary in chat.

### Example 3 — no themes yet

Preflight finds `processing.hasGroups: false` and roughly a hundred insights a month. The window proposal: "Nothing grouped into themes here and ~100 insights/month, so I'll look at the last 3 months — widen it if you want more history." The per-item half runs normally from individual insights; the unbuilt-demand section opens with its lower-confidence label and is synthesized from topic-volume sampling.
