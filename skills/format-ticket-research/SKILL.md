---
name: format-ticket-research
description: "Use when a product manager or engineer wants to ground a ticket (Linear, Jira, or any tracker) in real customer evidence using Format MCP. Canonical invocation: 'using the Format MCP and the format-ticket-research skill, research this ticket' followed by pasted ticket text or a ticket reference. Also triggers on 'what are customers saying about this ticket', 'who's asking for this', 'find customer evidence for [ticket]', 'what requirements are customers implying for [feature]'. Produces a compact evidence page: customer asks grouped by the distinct need expressed, verbatim quotes with links to every piece of evidence, and what the evidence suggests the ticket should account for. It presents evidence and context — it never grades demand or recommends whether to build."
metadata:
  title: Ticket Research
  personas: [product]
  image: card.jpg
  use_case: >-
    Ground any ticket in customer reality before you build it. Paste a ticket
    and get back what customers have actually said about the problem behind
    it: the distinct asks grouped and linked to every supporting quote, who
    raised them and when, and what the evidence implies that the ticket never
    wrote down.
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

It presents evidence and the context needed to weigh it. It **never** grades demand ("strong", "weak"), ranks the ticket, or recommends building or killing it — whether the evidence is compelling depends on things only the reader can judge: how well this kind of feedback gets captured, how much customers talk about this area in general, and what else competes for the team's time.

## When to use it

- A ticket is about to be picked up and someone asks "what do we actually know about this?"
- A PM wants customer quotes attached to a ticket or spec
- An engineer wants to know what customers expect before designing
- Backlog grooming on a specific item

Do NOT use this skill to validate a whole roadmap or a list of items — it goes deep on **one** ticket.

## Inputs

**Required: the ticket.** Pasted title + description is the baseline and always works. If a tracker MCP (Linear, Jira, etc.) is connected and the user gives an ID or URL, fetch the ticket from there — include its comments, which often carry customer context the description lacks. Never require a tracker connection.

Do not ask the user setup questions. The research loop below discovers customer vocabulary on its own. Ask only if the ticket is genuinely too vague to extract a customer problem from — and then ask one question, not a form.

## Stage 0 — Preflight: understand the evidence base

Run three cheap checks before researching. Their results calibrate everything downstream and feed the output's context section.

1. **Volume and breadth:** `count_insights` with `{ level: 0, groupBy: "company" }` — total insight volume and how many distinct companies it spans, in one call.
2. **Aggregated answers:** `count_insights` with `{ level: "aggregated" }` — whether this workspace has aggregated answers (themes synthesized across customers). Judge by the response **shape**, not the bare number: when aggregated answers exist, the response carries a per-level breakdown; when none exist, the tools transparently fall back to verbatim quotes, so a non-zero count alone does not prove aggregated answers are present. (Equivalently: if an "aggregated" search returns items with individual quotes and speakers instead of synthesized titles and customer counts, the workspace has none.) Having none is normal, not an error — work from verbatim quotes and skip the theme-based steps below. When they do exist, they're a major research asset.
3. **Listening coverage:** `list_topics` — what kinds of feedback this workspace extracts. Format only captures what its topics ask for, so note whether any topic plausibly covers this ticket's domain. This matters most when the search comes back empty (see "When little or nothing is found").

If the workspace holds very little data overall, say so up front — the research will be anecdotal — and let the user decide whether to continue. Judge "very little" against what the output needs to be useful, not against a fixed number.

## Stage 1 — Frame the ticket

Tickets are written in builder language; customers speak in problem language. Distill the ticket into:

- **The solution being built** — one line
- **The customer problem it addresses** — one line, phrased the way a customer would say it
- **An initial probe set** — a handful of short natural-language search phrases spanning both solution language ("bulk CSV export") and problem language ("getting our data out takes forever")

These probes are a starting point, not the search. The loop refines them.

## Stage 2 — Research loop: poke, learn the language, search deeper

The make-or-break problem is vocabulary: customers rarely use the ticket's words. Solve it iteratively rather than by guessing up front.

**Round 1 — poke.** For each initial probe, call `search_insights` with `{ semanticQuery: "<probe>", level: 0 }`. Add a keyword pass with `{ keywordSearch: [...] }` for terms semantic search ranks poorly (product names, file formats, integration names). If aggregated answers exist, also search them (`level: "aggregated"` with keywords, or scoped by `topicNames` from preflight) — a matching theme is both confirmation the need exists at scale and a direct route to its supporting quotes: re-fetch with `select: "extended"`, locate your answer by ID in the response (extended aggregated results come back as a full page and can be very large), take its supporting insight IDs, and pass them back through `search_insights` at level 0 to get the verbatim quotes.

**Learn.** Read the round's hits and extract how customers actually talk about this: their phrasings, the names they use for features and workflows, adjacent complaints that turn out to be the same need. Matching aggregated themes are a vocabulary goldmine — their synthesized claims are written from many customers' words.

**Round 2+ — search deeper.** Re-search with the learned vocabulary. On strong hits, use `similarToInsightId` to walk the insight graph and surface co-clustered quotes a text query would miss. Repeat until a round stops producing new accepted evidence — saturation, not a fixed round count, ends the loop.

**Deduplicate everything by insight ID across all rounds.**

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

For needs-context insights whose resolution would change the picture — they're the only evidence for a group, or they tip a group from one need to another — fetch the underlying record with `get_record` and read the surrounding conversation. Records are full transcripts and can run to thousands of words: locate the quote and read around it rather than processing the whole conversation. Then either confirm (note that it was verified against the source) or discard. Insights that stay ambiguous after a deep-dive are shown **as ambiguous** — never silently promoted to clear evidence, never silently dropped.

## Stage 3 — Group and present; do not grade

**Group the accepted evidence by the distinct need expressed.** Variants of the ask are separate groups — "export to CSV" and "scheduled export to our warehouse" are different needs even if one ticket could cover both. Name each group in customer language.

**Do not score, rank, or label demand strength.** No "strong demand", no "weak signal", no scores. Whether evidence is compelling depends on relative volume, capture quality, and how much this area gets discussed at all — judgments that belong to the reader. The skill's job is to make that judgment easy:

- Per group: the raw facts (how many companies, who, the date span, latest mention) and a link to **every** supporting insight — the best one or two quotes inline, the rest as links, never an unverifiable summary.
- A calibration block: total workspace volume over the same span, whether any topic listens for this area, and whether aggregated answers were available — the denominators a reader needs to weigh the numerators.

### When little or nothing is found

Empty results have three different causes, and the output must say which applies — they lead to opposite conclusions:

1. **Thin workspace** — preflight showed little data overall. The absence means nothing.
2. **Extraction gap** — no topic listens for this domain, so Format was never asked to capture it. Suggest the user consider a topic for this area (a suggestion only — never create or modify anything in Format).
3. **Genuinely quiet** — coverage is healthy, relevant topics exist, and customers still aren't raising it. Even then, report it as "no captured evidence", not "customers don't want this".

## Stage 4 — Render

Ask where the user wants the output if they haven't said — these are the destinations:

- **Chat** (default) — the structure below, rendered as markdown.
- **HTML evidence page** — the same content as a clean, self-contained HTML page: on claude.ai render it as an artifact; in Claude Code save it as an `.html` file and tell the user where. Every evidence link must be a real link to the insight or record in Format.
- **Comment on the ticket** — when a tracker MCP is connected, post the evidence directly as a comment on the ticket: show the user the comment as it will appear, then post it on their go-ahead. Adapt formatting to what the tracker renders well. Without a tracker connection, provide the comment as copy-ready text instead.
- **Format Brief** — if the workspace supports creating briefs via Format MCP, the user may ask for the output as a brief; if those tools aren't available, say so and fall back to one of the above.

Structure, regardless of destination:

```
# Customer evidence: [ticket title]

**At a glance** — [N] relevant insights from [M] companies, spanning [earliest]–[latest].
For scale: this workspace holds [total] insights from [total] companies over the same span.

## What customers are asking for

### [Need, in customer language]
[N] companies — [list] · latest mention [date]
> "[best verbatim quote]" — [name, role], [company], [date] ([link])
> "[second quote if it adds something]" — ... ([link])
All evidence: [link] · [link] · [link] ...
[If any item was verified against its source record or remains ambiguous, say so here in one line.]

### [Next need...]

## Counter-evidence
[Only if found; otherwise omit the section.]

## What the evidence suggests the ticket should account for
[Inferences, clearly labelled as such, each citing the groups/quotes it rests on.
If the evidence supports no inferences, omit the section.]
- Customers describing this need were mostly [X] — see [group], which suggests [Y]

## Read this with
[The calibration block: listening coverage for this domain, whether aggregated
answers existed, anything that limits what the numbers above can mean.]
```

Keep it compact: lead with the groups, one or two quotes inline per group, everything else as links. Omit empty sections entirely. If the user wants the full quote bank, expand on request rather than defaulting to a wall of quotes.

## Hard rules

- **Verbatim quotes only, always cited.** Quote the insight's text exactly, with speaker, company, date, and link. Never paraphrase inside quotation marks; never fabricate.
- **Every group links all of its evidence.** A claim the reader can't click through to verify doesn't go in the output.
- **No demand grades, scores, or build/kill recommendations.** Present evidence and context; the reader concludes.
- **Inference is labelled.** Everything in "what the evidence suggests" cites its sources; if it can't be cited, it isn't written.
- **Absence is disambiguated.** Apply the three-cause rule whenever evidence is missing or sparse.
- **Read-only on Format.** Query freely; never create, modify, or delete anything in Format. The only write this skill ever performs is posting the tracker comment, after showing it to the user.

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
