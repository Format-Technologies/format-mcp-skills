---
name: format-ticket-research
description: "Use when a product manager or engineer wants to ground a ticket (Linear, Jira, or any tracker) in real customer evidence using Format MCP. Canonical invocation: 'using the Format MCP and the format-ticket-research skill, research this ticket' followed by pasted ticket text or a ticket reference. Also triggers on 'what are customers saying about this ticket', 'who's asking for this', 'find customer evidence for [ticket]', 'what requirements are customers implying for [feature]'. Produces a compact evidence page: customer asks grouped by the distinct need expressed, verbatim quotes with links to every piece of evidence, and what the evidence suggests the ticket should account for. It presents evidence and context rather than grading demand or recommending whether to build."
metadata:
  display_order: 20
  title: Ticket Research
  personas: [product]
  image: card.jpg
  related: [format-roadmap-check]
  use_case: >-
    Ground a ticket in customer reality before you build it. Paste it (or
    point at the tracker issue) and get back what customers have actually
    said about the problem behind it: each distinct ask in their own words,
    who raised it and when, every quote linked to its source — and the
    requirements the evidence implies but the ticket doesn't spell out.
  limitations: >-
    Presents evidence; the conclusions are yours — it deliberately does not
    score or rank demand. Quality depends on conversation coverage in Format
    and on whether a topic is listening for this kind of feedback; the output
    tells you when either is the limiting factor.
  prompts:
    - "Using the Format MCP and the format-ticket-research skill, research this ticket: [paste ticket]"
    - "Who's actually asking for this, and what do they expect it to do? [paste ticket]"
    - "Research the ticket about bulk export and post the evidence as a comment on it."
---

# Format Ticket Research

## What this skill does

Given one ticket — pasted text or fetched from a connected tracker — this skill researches what customers have actually said about the problem behind it and produces a compact evidence page with three parts:

1. **What customers are asking for** — grouped by the distinct need expressed, in customer language, with verbatim quotes and a link to every piece of supporting evidence
2. **Who and when** — which companies and people raised each need, and how the mentions are spread over time
3. **What the evidence suggests the ticket should account for** — clearly-labelled inferences, each citing the quotes it came from

It presents evidence and the context needed to weigh it, and deliberately stops short of grading demand ("strong", "weak"), ranking the ticket, or recommending building or killing it — whether the evidence is compelling depends on things only the reader can judge: how well this kind of feedback gets captured, how much customers talk about this area in general, and what else competes for the team's time.

## When to use it

- A ticket is about to be picked up and someone asks "what do we actually know about this?"
- A PM wants customer quotes attached to a ticket or spec
- An engineer wants to know what customers expect before designing
- Backlog grooming on a specific item

This skill goes deep on **one** ticket. Validating a whole roadmap or a list of items is a different job — that's what `format-roadmap-check` is for.

## Inputs

**Required: the ticket.** Pasted title + description is the baseline and always works. If a tracker MCP (Linear, Jira, etc.) is connected and the user gives an ID or URL, fetch the ticket from there — include its comments, which often carry customer context the description lacks. A tracker connection is a bonus, not a requirement: pasted text alone is always enough.

If a Format company-context document (the output of the `format-company-context` skill) is already in the conversation, use it to sharpen the problem framing and initial probes — never require one or block on its absence.

Setup questions are rarely needed — the research loop below discovers customer vocabulary on its own, so the best default is to just start. If the ticket is genuinely too vague to extract a customer problem from, one pointed question beats a form.

## Stage 0 — Preflight: understand the evidence base

Two cheap calls before researching. Their results calibrate everything downstream and feed the output's context section.

1. **`describe_org()` — most of the preflight in one call.** It answers three questions the research depends on:
   - **The period the search can see.** `coverage.earliestRecordAt` → `latestRecordAt`, plus `recordCount` and `companyCount`. The output should say what period it could actually see, so the dates of the evidence found read against the dates that existed to be found.
   - **Listening coverage.** `topics[]`, each with the standing question it asks and its `insightCount`. Format only captures what its topics ask for, so note whether any topic plausibly covers this ticket's domain. This matters most when the search comes back empty (see "When little or nothing is found").
   - **Whether Format's own analysis is available.** `processing.hasGroups`. `true` means customers' words have been gathered into **insight groups** — themes across many customers, each carrying how many distinct customers contributed. `false` means nothing here has been grouped at all; that is normal, not an error, and simply means working from individual insights and skipping the theme-based steps below. `processing.pendingInsightCount` says how far the groups lag the insights.
2. **Volume and breadth:** `count_insights({ breakdownBy: "company" })` — total insight volume and how it spreads across companies, in one call. Read two fields carefully: `count` is always the full total, while `breakdown` only covers insights that have a company at all, and `isBreakdownTruncated` is true when the buckets don't account for everything (unattributed insights, or more than 200 companies). The unattributed share belongs in the output's calibration block.

If the workspace holds very little data overall, say so up front — the research will be anecdotal — and let the user decide whether to continue. Judge "very little" against what the output needs to be useful, not against a fixed number.

## Stage 1 — Frame the ticket

Tickets are written in builder language; customers speak in problem language. Distill the ticket into:

- **The solution being built** — one line
- **The customer problem it addresses** — one line, phrased the way a customer would say it
- **An initial probe set** — a handful of short natural-language search phrases spanning both solution language ("bulk CSV export") and problem language ("getting our data out takes forever")

These probes are a starting point, not the search. The loop refines them.

## Stage 2 — Research loop: poke, learn the language, search deeper

The make-or-break problem is vocabulary: customers rarely use the ticket's words. Solve it iteratively rather than by guessing up front.

**The two verbs.** There is no altitude dial — the tool you call is the altitude you get. `search_insights` returns what one person said, once, in their own words: the evidence. `search_insight_groups` returns themes across customers: the scale signal, and a shortcut to the evidence beneath each one.

**Round 1 — poke.** For each initial probe, call `search_insights({ semanticQuery: "<probe>" })`. Add a keyword pass with `{ keywordSearch: [...] }` for terms semantic search ranks poorly (product names, file formats, integration names). Keep these evidence searches unscoped by topic: `describe_org` diagnoses what the workspace listens for, but every insight sits under exactly one topic, so a topic filter silently drops everything that landed under a topic you didn't pick — and customers rarely file their words where the ticket would. If `hasGroups` was true, run `search_insight_groups` over the same territory too — a matching theme is both confirmation the need exists at scale and a direct route to its evidence: take the group's `id` and call `search_insights({ supportingGroupId: "<id>" })`, which returns every insight gathered under it, however deep. Groups take the same filters (`topicNames`, `keywordSearch`, `dateRange`, `companyIds`, `attributeFilters`) but **not** `semanticQuery`, which searches individual insights; passing it fails the call rather than being ignored. Group ids are handles for this conversation only; never write one into the output or a saved artifact.

**Learn.** Read the round's hits and extract how customers actually talk about this: their phrasings, the names they use for features and workflows, adjacent complaints that turn out to be the same need. Matching insight groups are a vocabulary goldmine — each group's `title` and `subtitle` are written from many customers' words.

**Round 2+ — search deeper.** Re-search with the learned vocabulary. On strong hits, call `find_similar_insights({ insightId })` to reach sideways to insights that belong near it — via a shared insight group where the workspace has been clustered (`relationship.kind: "shared_group"`, naming the connecting theme), or by wording where it hasn't (`"semantic"`, with a `score`). Repeat until a round stops producing new accepted evidence — saturation, not a fixed round count, ends the loop.

**Read an insight in full when it's load-bearing.** `get_insight({ insightId })` returns one insight with three things a search row doesn't carry unconditionally: `context` (the extraction's summary of the surrounding conversation), `groups` (which themes it belongs to), and `followUp` (what was said next — the reply, the objection, or where the thread went). Read `followUp` as a description of the conversation, never as a recommended action.

**Deduplicate across all rounds — by ID and by content.** ID-level dedup is not enough: the same customer statement is often extracted under multiple topics as separate insights with different IDs. Treat near-identical text from the same `record.id` as **one** piece of evidence — count it once, cite it once (any of its `shareUrl`s works).

### Adjudicate every candidate

Semantic similarity is not demand. Judge each candidate insight and bucket it:

- **Direct ask** — the customer explicitly requests this capability
- **Implied need** — the customer describes pain this ticket would resolve, without asking for it
- **Adjacent** — same area, different need → **discard**
- **Counter-evidence** — the customer wants the opposite, or describes the ticket's approach as a problem → keep, presented separately

### Flag certainty — and resolve it from the source

Alongside the bucket, mark each accepted insight:

- **Clear** — the quote unambiguously expresses the need on its own
- **Needs context** — plausible but ambiguous: the quote could be about something else, the situation is unclear, or the ask is fragmentary

For needs-context insights whose resolution would change the picture — they're the only evidence for a group, or they tip a group from one need to another — fetch the underlying record with `get_record` and read the surrounding conversation. Records are full transcripts and can run to thousands of words: locate the quote and read around it rather than processing the whole conversation. Then either confirm (note that it was verified against the source) or discard. Insights that stay ambiguous after a deep-dive keep their flag in the output — promoting them silently overstates the evidence, dropping them silently understates it.

## Stage 3 — Group and present; the reader concludes

**Group the accepted evidence by the distinct need expressed.** Variants of the ask are separate groups — "export to CSV" and "scheduled export to our warehouse" are different needs even if one ticket could cover both. Name each group in customer language.

**Leave demand strength to the reader.** Labels like "strong demand" and "weak signal" feel helpful but aren't: whether evidence is compelling depends on relative volume, capture quality, and how much this area gets discussed at all — judgments that belong to the reader, not the page. The skill's job is to make that judgment easy:

- Per group: the raw facts (how many companies, who, the date span, latest mention — and, when an insight group matched the group, that group's `customerCount`, the cheapest scale signal available; rank with it, never sum it across groups, since nested themes count the same customer more than once) and a link to **every** supporting insight — the best one or two inline, the rest as links, rather than an unverifiable summary.
- Expect attribution gaps: many insights have no linked company, and some carry a company name without a linked company record. Count distinct companies by **name**, and surface unattributed evidence on its own line ("plus [N] mentions from speakers not linked to a company") rather than silently dropping it.
- A calibration block: total workspace volume over the same span, whether any topic listens for this area, and whether insight groups were available — the denominators a reader needs to weigh the numerators.

### When little or nothing is found

Empty results have three different causes that lead to opposite conclusions, so the output should say which one applies:

1. **Thin workspace** — preflight showed little data overall. The absence means nothing.
2. **Extraction gap** — no topic listens for this domain, so Format was never asked to capture it. Suggest the user consider a topic for this area (a suggestion only — never create or modify anything in Format).
3. **Genuinely quiet** — coverage is healthy, relevant topics exist, and customers still aren't raising it. Even then, report it as "no captured evidence", not "customers don't want this".

## Stage 4 — Render

Deliver to the destination the user named. When they named none, default to **chat** rather than asking — a destination question at render time costs a round-trip exactly when the user wants the answer; instead, offer the alternatives in one line alongside the delivered output ("want this as an HTML page, a comment on the ticket, or a report published in Format?"). The destinations:

- **Chat** (default) — the structure below, rendered as markdown.
- **HTML evidence page** — the same content as a clean, self-contained HTML page: as an artifact where the environment supports them, otherwise a saved `.html` file (tell the user where). Every evidence link should be a real, working link to the insight or record in Format — on a page this polished, a dead link is worse than none.
- **Comment on the ticket** — when a tracker MCP is connected, post the evidence directly as a comment on the ticket: show the user the comment as it will appear, then post it on their go-ahead. Adapt formatting to what the tracker renders well. Without a tracker connection, provide the comment as copy-ready text instead.
- **A report in Format** — when `create_report` is available on the connection (it is gated per organization, so it simply won't be there for every workspace), the evidence page can be authored as a first-class Format report with its own share URL: embedded insights stay clickable and playable, and the opener becomes the report's `tldr`. Show the user what you're about to publish before you write it; a report is born a draft visible only to you, and `publish_report` is the separate, explicit step that makes it org-visible. If the tool isn't on the connection, say so and fall back to one of the above.

**Open by setting the stage.** The page travels — posted on the ticket, pasted into chat, read weeks later by someone who never saw the request — so don't drop a cold reader straight into the evidence. Open with a couple of plain sentences that say what question was researched, what period the data covers, and the main finding, stated as neutral fact. In a Format report, this opener is the `tldr`.

**Write for scanning, not reading.** A wall of dense prose is the failure mode here. Let tables carry the structure and keep prose to quotes plus a line or two of commentary — the reader should get the whole picture from the at-a-glance line and the evidence map, then drill into only the groups they care about.

**Caveats once, method never.** A caveat lands hardest when it's said once, in the one place it changes the reading — usually the "Read this with" block; the opener states the framing, and no other section needs to re-explain it. Narrating this skill's own method or rules ("demand grades are deliberately omitted", "these are surfaced examples, not a census") is the other tell of process leaking into the page — the output should read as research, not as a description of how the research was done.

Structure, regardless of destination:

```
# Customer evidence: [ticket title]

[The stage-setting opener — two or three sentences: the customer problem
researched, the period the evidence covers, and the main finding as
neutral fact. "What customers have said about getting data out of the
product, across conversations from Mar 2025 to Jun 2026. The demand
splits into two distinct needs — one-off exports and a recurring sync —
and the second isn't covered by the ticket as written."]

**At a glance:** [N] pieces of evidence · [M] companies · [earliest]–[latest].
For scale: [workspace totals over the same span]. [One sentence on mechanism
vs. area, if the distinction exists.]

## Evidence map

| What customers are asking for | Companies | Mentions | Latest | Certainty |
|---|---|---|---|---|
| [need, customer language] | 2 ([names]) +1 unlinked | 8 | [date] | clear, source-verified |
| [need, customer language] | 1 ([name]) | 3 | [date] | partly ambiguous |

## [Need 1, named as in the table]
> "[best verbatim quote]" — [name], [company], [date] ([link])
[A line or two of commentary — only what the quote can't say itself.]
All evidence: [link] · [link] · [link] ...

## [Need 2...]

## What the evidence suggests the ticket should account for
[Inferences, clearly labelled as such, each citing the groups/quotes it rests
on. Counter-evidence belongs here when it directly shapes a requirement; give
it its own short section only when it stands alone. Omit if the evidence
supports no inferences.]

## Read this with
[The calibration block as 2–4 tight bullets: the period the search could
see (the corpus's overall date span) vs. the dates of the evidence found;
listening coverage for this domain; whether insight groups existed;
anything else that limits what the numbers above can mean.]
```

Formatting notes:

- Cite speakers by name and company — add a role/title only when the data actually provides one; never guess it.
- Markdown destinations (chat, tracker comments): use the evidence map table as-is — trackers like Linear and Jira render markdown tables. Keep cells to a few words so rows don't wrap badly.
- HTML page: same structure with richer treatment — a real table, and every count clickable through to its evidence.

**Charts, where they earn it.** When the *timing* of mentions tells a story — clustered around a release, accelerating, gone quiet — add a compact mention timeline for the group (or one combined timeline). In markdown destinations use a unicode bar row:

```
2025 Q3 ▎1   Q4 ▌2   2026 Q1 ▉6   Q2 ▋4
```

On the HTML page, draw real bars (inline SVG or styled divs — self-contained, no external libraries or network requests), each bar linking to its insights. A good chart shows something the reader would otherwise have to assemble from the citations themselves; skip it when the table already says it — a handful of mentions inside one month is just "all within [month]" in the table.

Omit empty sections entirely. If the user wants the full quote bank, expand on request rather than defaulting to a wall of quotes.

## Principles

These are the defaults that make the output trustworthy. They're guidance, not law — depart when the situation genuinely calls for it, and say so when you do. The exception that stays firm: quotes are never fabricated.

- **Quotes are verbatim and cited.** The page's authority rests entirely on them being real. Quote the insight's `text` exactly, with speaker, company, date, and its `shareUrl`; paraphrase belongs outside quotation marks. Where `person.source` or `company.source` reads `inferred`, the name came out of the conversation rather than a linked customer record — hedge it.
- **Claims stay clickable.** The reader should be able to verify anything by clicking through to its evidence — a claim with nothing behind it weakens everything around it.
- **The reader concludes.** Evidence and context over demand grades, scores, or build/kill recommendations — the judgment depends on constraints only the reader knows.
- **Inference is visible as inference.** Anything in "what the evidence suggests" names the quotes it rests on; a suggestion that can't cite its sources is the skill's opinion, and reads like it.
- **Absence gets explained.** When evidence is missing or sparse, say which of the three causes applies — they point in opposite directions, and the reader can't tell them apart without help.
- **Reading is the default; writing is asked for.** Query Format freely. The only things this skill ever writes are the two the user picked as a destination — a tracker comment, or a report authored into Format — and both are shown before they happen. It never edits or deletes anything that was already in the workspace.

## How to prompt this skill

```
Using the Format MCP and the format-ticket-research skill, research this ticket:

[paste ticket title + description]
```

### Example 1 — pasted ticket

User pastes a ticket titled "Bulk export to CSV". The skill preflights the workspace, frames the problem ("getting data out of the product into spreadsheets/BI"), pokes, learns from the first hits that customers say "pull the raw numbers" and name a specific BI tool, re-searches with that vocabulary, and walks similar insights from the strongest hits. Output: two groups — "export raw data to spreadsheets" (several companies, quotes linked) and "scheduled sync to a warehouse" (one company, verified against the source record) — plus an inference: part of the demand is recurring sync, which the ticket's one-off export doesn't cover.

### Example 2 — empty result, extraction gap

User pastes a ticket about SSO session length. The loop finds nothing, but preflight showed a healthy workspace with no topic covering auth or security feedback. The output says exactly that: no captured evidence, most likely because nothing is listening for this domain — and suggests a topic for it. It does not claim customers don't care.

### Example 3 — tracker connected, comment requested

User: "Research PROJ-142 and put the evidence on the ticket." A tracker MCP is connected, so the skill fetches the issue and its comments, runs the research, shows the user the comment as it will appear, and posts it on their go-ahead.
