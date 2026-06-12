---
name: format-roadmap-check
description: "Use when a product manager or leader wants to check a roadmap against real customer evidence using Format MCP — answering 'are customers asking for what we're building?' and the inverse, 'what are customers asking for that we're not building?'. Canonical invocation: 'using the Format MCP and the format-roadmap-check skill, check this roadmap' followed by a pasted list of roadmap items or a reference to a tracker project/epic. Also triggers on 'validate this roadmap against customer feedback', 'is there evidence for these roadmap items', 'what are customers asking for that isn't on the roadmap', 'roadmap evidence check', 'gap analysis on our roadmap'. Produces an evidence board: per-item customer evidence with links to every quote, plus the demand themes no roadmap item covers. It presents evidence and context — it never scores items or recommends what to build or cut."
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

It presents evidence and the context needed to weigh it. It **never** scores items, grades demand, ranks the roadmap, or recommends building or cutting anything — whether the evidence is compelling depends on things only the reader can judge: capture quality, how much customers discuss this area in general, strategy, and what else competes for the team's time. The board's job is to make the evidence so legible that the reader's own conclusion is easy.

## When to use it

- Roadmap or quarter planning: "is what we've planned grounded in what customers say?"
- A leadership review asks for customer evidence behind the plan
- Periodic sanity check: "what are customers asking for that we're not building?"

Do NOT use this skill for deep research on a single ticket or feature — that's survey depth across many items. See "Related skills" at the end for the hand-off.

## Inputs

**Required: the roadmap.** A pasted list of items (titles, ideally with a line of description each) is the baseline and always works. If a tracker MCP (Linear, Jira, Notion, etc.) is connected and the user points at a project, epic, milestone, or document, fetch the items from there — but never require a tracker connection.

**Optional, never interrogate:**

- **Existing context** — if a Format company-context document (the output of the `format-company-context` skill) is already in the conversation, use it to inform item reframing and search vocabulary. Never require one or block on its absence.
- **Timeframe** — if the user names a window, use it. Otherwise the skill proposes one from the data (see Stage 1); it never silently defaults.
- **Segment scope** — the user may scope evidence to a customer segment (e.g. "active paying customers only"). Resolve via `list_org_attributes` to find the workspace's CRM attribute labels, then pass `attributeFilters` on every insight query. If the requested attribute doesn't exist in the workspace, say so and proceed unscoped rather than guessing.

## Stage 0 — Preflight: understand the evidence base

Run these cheap checks before anything else. Their results calibrate the whole run and feed the board's context section.

1. **Volume and breadth:** `count_insights` with `{ level: 0, groupBy: "company" }` — total insight volume and how many distinct companies it spans. Expect a null group for insights with no linked company: it isn't a company, and its share of the total belongs in the board's calibration block (a workspace where a quarter of the evidence is unattributed reads differently).
2. **Rate and span:** one more `count_insights` over a recent slice (via `dateRange`) to estimate roughly how many insights per month this workspace produces — and note the corpus's overall date span while you're at it. A freshly-ingested workspace may hold months of conversations imported on a single day; the window proposal in Stage 1 depends on both facts.
3. **Aggregated answers:** `count_insights` with `{ level: "aggregated" }` — whether the workspace has aggregated answers (themes synthesized across many customers). Judge by the response **shape, not the bare number**: when aggregated answers exist, the response carries a per-level breakdown; when none exist, the tools transparently fall back to verbatim quotes, so a non-zero count alone does not prove aggregated answers are present. (Equivalently: if an "aggregated" search returns items with individual quotes and speakers instead of synthesized titles and customer counts, the workspace has none.) Having none is normal, not an error — it means the quotes-only paths below. When they do exist, they're a major asset for both halves of the board.
4. **Listening coverage:** `list_topics` — what kinds of feedback this workspace extracts. Format only captures what its topics ask for; note which topics plausibly cover the roadmap's domains. Note also what product or audience the workspace's conversations appear to concern — topic definitions and early search hits usually make it obvious. If it visibly isn't the product the roadmap belongs to (wrong org selected, a demo workspace), raise that at the Stage 1 checkpoint: every empty row on the board would be an artifact of the mismatch, not of demand.
5. **Company knowledge:** `list_org_attributes` — what the workspace knows about its companies beyond their names. Look especially for anything that separates prospects from customers (lifecycle stage, customer status, plan tier). An ask heard on an early prospecting call and the same ask from a paying customer are different evidence, and a board that silently blends them misleads. If such an attribute exists, bring it to the Stage 1 checkpoint as a scope choice. Finding nothing lifecycle-like is also normal — run unscoped and don't manufacture a segment from weaker signals.

If the workspace holds very little data overall, say so — the board will be anecdotal — and let the user decide whether to continue; fold this into the Stage 1 checkpoint rather than making a separate stop. A preflight that finds a healthy workspace needs no announcement at all: its numbers belong in the board's calibration block, not in chat.

## Stage 1 — Parse the roadmap and propose the window (one checkpoint)

This skill makes exactly one stop before the long research run. Prepare three things and show them together:

**1. The parsed roadmap.** Normalize the input into a list of items. For each: the item title, and the customer problem behind it in one line of customer language (solution-speak → problem-speak, exactly as a customer would describe the pain). Flag items that look **internal** — infrastructure, tech debt, compliance, replatforming — where customer evidence wouldn't be expected even for worthwhile work. Internal items stay on the board but are marked so an empty evidence row reads as "not customer-facing," never as "nobody wants this."

**2. The timeframe proposal, earned from the data.** Propose a window and show the reasoning, derived from preflight:

- **With aggregated answers**, themes compress volume and already encode how mentions developed over time, so windows of several months up to a year work well.
- **Without aggregated answers**, the unit of work is the raw quote, so scale the window inversely to the monthly insight rate — wide enough to be representative, narrow enough that every candidate can still be honestly adjudicated. As illustrative calibration: a workspace producing thousands of insights a month points to a window of weeks; hundreds a month points to a few months; less than that, wider.

One boundary case overrides the heuristics: **if the corpus's date span is shorter than any window you'd propose, propose the full span and say so** — "everything here was captured within [span], so I'll use all of it." Rate math on a corpus like that produces nonsense, and the board's calibration block must then note that there is no date spread to read trends from.

State the proposal in one line with its reason — "No aggregated answers and roughly [N] insights/month, so I'll look at the last [window]; say the word to widen or narrow it" — and let the user override with a word. If the user already named a window, skip the proposal and respect it.

**3. The run's remaining settings, as defaults to redirect.** Two more choices shape the run, and the checkpoint is the cheap moment to settle them:

- **Destination** — chat (compact board); an HTML page or equivalent artifact; a **Format Brief**, when the connection exposes the brief tools — the strongest option where it exists, because the board becomes a live, sharable Format artifact whose embedded insights stay clickable and playable; or a PDF, where the environment can produce one. Settle it now rather than at render time: by Stage 4 the user has waited through the whole run, and a destination question there costs a round-trip exactly when they want the answer. Pick the likeliest default from context (an explicit ask in the prompt wins; otherwise chat) and let them redirect with a word.
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
- **Window: last 6 months** (~4,800 of 6,500 insights; aggregated
  answers exist, so months-scale reads well) — say the word for 3 or 12.
- **Scope: customers only** (the workspace's "lifecycle stage" attribute
  separates them from prospects) — or unscoped with the mix disclosed.
- **Destination: chat** — or an HTML page, a Format Brief, or a PDF.
```

**Use the environment's question UI when there is one.** The settings are discrete choices, and some environments offer a structured way to ask — option pickers with a free-text escape, as in Claude's plan mode. Where such a tool is available, put window, scope, and destination through it, recommended option first, and keep the parsed-roadmap table in the message itself: reframings need free-form correction, not a picker. Where there is no such tool, prose like the example above does the job.

Take corrections (item framing, flags, window, scope, destination), then run without further questions.

## Stage 2 — Per-item research

**Run quietly.** The checkpoint was the conversation and the board is the deliverable; in between, the user is waiting, not reading along. A play-by-play in chat — "strong asks for X, now probing Y" — is the board leaking out early: every line of it gets read again, better organized, in the final render, and the environment already signals that work is happening. Speak mid-run only when something changes the run itself — a discovery that invalidates the checkpoint's framing, a workspace surprise, a blocker — and at most a line at a genuine seam (crossing from the per-item half to unbuilt demand), not per item or per query.

**Distill as you go.** A long roadmap multiplied by multi-round searches produces more raw results than one session can comfortably carry. After finishing each item, reduce it to exactly what the board needs — the need groups, their company counts and date spread, the one or two strongest quotes, the links — and research the next item against that summary, not against earlier items' raw search results. On a very large roadmap (roughly fifteen-plus items at this depth), say so at the checkpoint and propose splitting the run rather than degrading every item to fit.

For each customer-facing item, run a compact version of the iterative research loop (the Ticket Research skill runs the same loop at full depth):

1. **Poke:** search with a handful of probes spanning solution language and problem language — `search_insights` with `{ semanticQuery: "<probe>", level: 0 }` plus a `keywordSearch` pass for terms semantic search ranks poorly (product names, file formats, integration names). Keyword terms are OR'd together — pairing a precise term with a generic one ("Salesforce", "CRM") drowns the precise one, so probe precise terms separately or expect to filter the hits. Apply the agreed `dateRange` and any `attributeFilters` to every evidence query. Never narrow evidence searches by topic: `list_topics` diagnoses what the workspace listens for, but topics are a lens, not the corpus — scoping searches to them silently drops whatever insights no topic happened to capture. If aggregated answers exist, search them too (`level: "aggregated"`) — a matching theme is both confirmation the need exists at scale and a direct route to its quotes: re-fetch with `select: "extended"`, locate your answer by ID in the response (extended aggregated results come back as a full page and can be very large), take its supporting insight IDs, and pass them back through `search_insights` at level 0 for the verbatim quotes.
2. **Learn the language:** extract how customers actually phrase this need from the first round's hits, re-search with the learned vocabulary, and use `similarToInsightId` on strong hits to surface co-clustered quotes a text query would miss. At survey depth, a round or two past the initial poke is usually enough — stop when a round adds nothing new.
3. **Adjudicate strictly.** Semantic similarity is not demand. Bucket every candidate: **direct ask** (explicitly requests the capability), **implied need** (describes pain the item would resolve), **adjacent** (same area, different need — discard), **counter-evidence** (wants the opposite, or describes the item's approach as a problem — keep, shown separately). Candidates flagged `isAiRejected` aren't discarded out of hand — fetch the rejection reason (`select: "extended"` carries it) and weigh it: a reason about fit to the insight's own topic doesn't invalidate the quote as evidence for a roadmap item, while a reason about substance (content-free, unsupported, misattributed) does. If a rejected insight makes the board, note the flag alongside its citation.
4. **Flag certainty.** Mark each accepted insight **clear** or **needs context**. For needs-context insights, fetch the underlying conversation with `get_record` and read the surrounding exchange — then confirm or discard. At survey depth, deep-dive only where the resolution would change that item's picture (e.g. the item's evidence hinges on one ambiguous quote). Anything still ambiguous is shown as ambiguous, never silently promoted.
5. **Quantify locally — and count moments, not rows.** The accepted insights carry company, person, and timestamp — compute distinct companies, the date spread, and the latest mention from what's already in hand rather than issuing more queries. Two corrections matter for honest numbers: **(a)** Format extracts insights per topic, so one customer statement can exist as several near-identical insight rows — **dedupe on the record ID**: insights sharing a record that restate the same ask are one mention, and a record counts more than once only when it genuinely contains distinct asks (different speakers or different needs in the same conversation). **(b)** Company attribution can be partial — some insights carry a company name without a linked record, with spelling variants — so count companies by normalized name, and disclose how much of the item's evidence is unattributed when it's material. **(c)** When the workspace distinguishes prospects from customers and the run is unscoped, count them separately — "6 companies" where five are early-stage prospects is a materially different fact than six paying customers, and the board should say which it is.

**When an item comes up empty,** name the most likely cause — they mean opposite things:

- **Internal item** — evidence wasn't expected; the flag from Stage 1 already says so.
- **Outside the window** — before claiming silence, run one `count_insights` for the item's vocabulary over a wider range (skip this when the window already covers the full corpus). If older evidence exists, say "no mentions in the last [window], though older mentions exist" with a link path to them.
- **Extraction gap** — no topic listens for this domain, so Format may never have captured it. Suggest (suggest only — never create anything) that the workspace could add a topic for the area.
- **Workspace mismatch** — the conversations in this workspace concern a different product or audience than the roadmap (flagged at preflight). Then silence says nothing about demand, and the board must say so rather than reporting the items as quiet.
- **Genuinely quiet** — coverage is healthy, a relevant topic exists, the workspace matches the roadmap's product, and customers still aren't raising it. Report the silence as a fact, not a verdict.

## Stage 3 — Unbuilt demand (the inverse question)

Now flip the direction: what are customers raising that maps to nothing on the roadmap?

**With aggregated answers:** pull the workspace's aggregated answers for the window, focusing on those spanning multiple customers (`minCustomerCount` is available for exactly this). Match each theme against the roadmap items — a theme "maps" to an item when the item would plausibly resolve it; be generous toward the roadmap so the unbuilt list isn't padded with stretch mismatches. Generous means crediting plausible *resolution* — not direction-reversed or sibling needs (a bulk-*import* ask does not map to a bulk-*export* item; resolving one does nothing for the other). A need Stage 2 discarded as adjacent to some item belongs here if customers keep raising it. What remains unmatched is the unbuilt-demand list: present each with its customer count, date spread, one representative quote, and links to its evidence.

**Without aggregated answers,** this direction is inherently weaker — there is no synthesized census to compare against. Use the best available fallback: `count_insights` with `{ level: 0, groupBy: "orgTopic" }` over the window to find where the conversation volume concentrates, sample quotes from the heaviest areas, and synthesize the recurring asks yourself. Expect a null group for insights no topic captured — when it's material, sample it like any heavy area; topic-volume sampling alone reads only what the topics were asked to hear. Label this section clearly as a lower-confidence sketch ("synthesized from sampled quotes, not from Format's aggregated analysis") so it is read accordingly — and still include it; a labelled sketch beats silence.

## Stage 4 — Render the evidence board

Render to the destination settled at the checkpoint:

- **Chat** — the compact board, as markdown.
- **HTML page** — the full board: as an artifact where the environment supports them, otherwise a saved `.html` file. Every evidence link must be a real link into Format.
- **Format Brief** — the full board as a live Format artifact, composed with `create_lens_brief`: the board table, the strongest quote per item embedded as an insight block, remaining citations as inline insight chips — so every count stays clickable at the source — and the calibration block as a closing section. Share the brief's URL in chat alongside a two-line summary.
- **PDF** — where the environment can produce one: the HTML page's content, laid out for print.

The board, in reading order (identical content in every destination):

```
# Roadmap evidence check
[One neutral headline of facts, not judgment: "Customer evidence found for
7 of 12 items in the last N months; 3 items are internal; 4 recurring
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
representative quote, links to all evidence. In the quotes-only fallback,
open with the lower-confidence label.]

## Read this with
[The calibration block — neutral facts the reader needs to weigh the above:
window used and why — and, when the evidence found clusters much narrower
than that window, the span it actually covers; total insights and companies
in the window vs. the whole workspace, including the unattributed share; the corpus's date span
(and that trends are unreadable if it's compressed); whether aggregated
answers exist (and that the unbuilt section is a sketch if not); which
roadmap domains no topic listens for; any workspace/roadmap mismatch; any
segment scope applied — or, when the workspace can tell prospects from
customers and the run was unscoped, the mix.]
```

Verbosity is the enemy of an evidence board. The table carries the overview; the evidence sections carry depth **through links, not bulk** — at most two quotes inline per group, everything else linked. Omit empty sections rather than printing empty headings. Richer destinations may add layout — the HTML page can make the table the centerpiece with collapsible evidence sections; the brief swaps links for embedded insights — but never extra prose.

## Hard rules

- **Verbatim quotes only, always cited** — speaker, company, date, and source link. Never paraphrase inside quotation marks; never fabricate.
- **No grading, anywhere.** No scores, no strong/weak labels, no rankings, no build/cut recommendations. Counts, dates, and quotes are facts; adjectives about them are the reader's job.
- **Every count is linked.** Any number on the board ("6 companies") must lead to the evidence behind it — share links where they exist; in chat, a described query that reproduces the set ("search_insights for X over the same window") satisfies this when there are too many quotes to link individually.
- **Absence is disambiguated, never weaponized.** An empty row names its likely cause; it is never rendered as "customers don't want this."
- **One checkpoint, then work.** The Stage 1 stop is the only planned interaction before rendering.
- **The window is never silently defaulted.** Either the user named it or the skill proposed it with reasoning and the user saw it.
- **Read-only on Format — except the brief.** Query freely; never modify or delete anything in Format. The one permitted write is the brief the user chose as the destination at the checkpoint.

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

User pastes nine Q-next items. The skill preflights silently (healthy volume, aggregated answers exist), parses the items, flags two as internal, and shows the checkpoint — a dozen lines, table included, with "last 6 months" reasoned in one line and chat as the default destination. User tweaks one item's framing and confirms. The skill researches the seven customer-facing items without narrating between queries, finds evidence for five, marks one "extraction gap" (no topic covers that domain) and one "genuinely quiet," then surfaces three multi-customer themes no item covers. Board delivered in chat; user then asks for the HTML page; same content, rendered as a page.

### Example 2 — tracker project in, Brief out

User: "Check the 'Q3 Platform' project against customer evidence." A tracker MCP is connected, so the skill fetches the project's items from it. The Format connection exposes the brief tools, so the checkpoint proposes a Format Brief as the destination and the user takes it. After the run, the board is composed as a brief — strongest quotes embedded as insight blocks, remaining citations as inline chips — and the user gets the share URL plus a two-line summary in chat.

### Example 3 — quotes-only workspace

Preflight finds no aggregated answers and roughly a hundred insights a month. The window proposal: "No aggregated analysis here and ~100 insights/month, so I'll look at the last 3 months — widen it if you want more history." The per-item half runs normally from verbatim quotes; the unbuilt-demand section opens with its lower-confidence label and is synthesized from topic-volume sampling.
