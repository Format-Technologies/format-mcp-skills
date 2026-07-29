---
name: format-company-context
description: Use when a team wants to generate a shared company context document — the foundational brief on their positioning, ICP, personas, voice, and proof points — grounded in real customer conversations from their Format workspace. Trigger phrases include "build our voice-of-customer doc", "build our company context", "create a company brief", "what's our positioning", "extract our brand voice", "what do customers say about us", or "refresh our positioning doc". Uses the Format MCP to produce a single markdown document covering product overview, ICP, personas, pain points, competitive landscape, brand voice, and proof points — all backed by verbatim customer quotes. Runs end-to-end in one response; re-run quarterly as the customer base evolves. Not for writing blog posts, emails, ads, or case studies — those are downstream skills that read this context. For a targeting-focused ICP deep-dive (prospect criteria, qualification filters), use format-icp-definition instead.
metadata:
  display_order: 10
  title: Voice-of-Customer Context for AI
  personas: [customer-success, sales, marketing, product, leadership, research]
  image: card.jpg
  use_case: >-
    Stop re-explaining your company in every chat. One run distills what
    customers actually say — who you serve, what they struggle with, the
    words they use — into a context doc your team's AI works from, every
    claim quote-backed. It won't invent your strategy or pricing; it flags
    those for you to fill.
  limitations: >-
    Needs roughly 50+ customer conversations in Format for this depth. Some
    sections (pricing, business model, strategic positioning) can't come from
    conversations — the skill flags those as gaps for founder input rather
    than guessing.
  prompts:
    - "Build our company context from what customers actually say."
    - "Refresh our positioning doc from the last six months of conversations."
---

# Company Context

## What this skill is for

Most teams describe their company differently to their AI every time they open a new chat. Sales says one thing, marketing says another, the founder says a third. The result: outputs that don't match, messaging that drifts, and every teammate re-explaining the basics on every prompt.

This skill fixes that. One run → one comprehensive markdown file → every teammate working from the same foundation.

The document is not aspirational. It is not what the founder wishes the company sounded like. It is what the company actually is, extracted from what real customers say in calls, emails, and support channels via the Format MCP.

## Execution principle

This skill runs silently and completes in a single response. When invoked, the immediate next action is a tool call — not a chat message. No opening statement, no progress narration, no interim findings, no mid-run bailouts, no "want me to continue?" prompts. The user sees tool calls rendered by the UI; the next chat output is the finished document.

The document is the deliverable. Everything else is noise.

## What this skill produces

A single markdown file named `company-context.md`, delivered two ways:

1. **Inline in chat** so the user can read it immediately.
2. **As a markdown file**, saved using whatever file mechanism your environment provides (a presented download on claude.ai, a file in the working directory in Claude Code or Cursor). If your environment can't produce files, inline only is fine.

The document has fourteen sections:

1. **Product overview** — one-liner, what it does, category, business model
2. **Target audience & JTBD** — who it's for, jobs to be done, use cases by team
3. **ICP** — firmographic sweet spot, triggers, disqualifiers
4. **Personas** — 3–4 archetypes in a table: cares about / challenge / value we promise
5. **Problems & pain points** — core problem, why alternatives fall short, what it costs, emotional tension
6. **Competitive landscape** — high / medium / low risk competitors, category summary, positioning statement
7. **Differentiation** — key differentiators, how we do it, why it's better, why customers choose us
8. **Objections** — table of objection / response / customer proof
9. **Anti-persona & sales cycle pattern** — who it's not for, common buying path
10. **Switching dynamics (JTBD forces)** — Push / Pull / Habit / Anxiety, each with verbatim evidence
11. **Customer language** — how they describe the problem (thematic clusters), how they describe the product, words to use, words to avoid, glossary
12. **Brand voice** — tone, style, personality, each with the insight that evidences it
13. **Proof points** — testimonials, value themes, notable customers, buyer profile pattern, geography, stack
14. **Last refreshed** — date + what changed since last run

Section headers use human labels. The file is structured to be pasted into any doc tool without reformatting.

## When to use

- First time setting up a shared GTM foundation for a team
- Before launching a new marketing motion (content, outbound, ads, events)
- Quarterly refresh as the customer base evolves
- When onboarding new marketing, sales, or CS hires
- When positioning feels stale or outputs from different teammates are drifting apart
- Before a board deck, fundraise, or major messaging update

## When NOT to use

- Fewer than ~50 customer conversations in Format — not enough signal for this depth
- Writing a single deliverable (blog post, email, ad, case study) — those are downstream skills
- A targeting-focused ICP deep-dive (prospect list criteria, qualification filters, seed accounts) — that's `format-icp-definition`; this document is the broad foundation it sits on

## Setup

If Format MCP isn't connected yet:
1. Settings → Connectors → Add custom connector
2. URL: `https://useformat.ai/api/mcp`
3. Authenticate with your Format account

No configuration needed beyond that. The skill queries whatever Format workspace the MCP is connected to.

---

## The run — how the skill executes

Tight sequence. Target: 12–16 tool calls total.

**Themes first, words second.** Format has two retrieval verbs, and the one you call is the altitude you get:

- `search_insight_groups` — **what customers collectively say.** An insight group is a theme: many similar insights, from different customers in different conversations, gathered under one label, carrying `customerCount` (how many distinct customers contributed), `mentions`, a first/last-seen span, and a `lifecycleState`. These become the document's messaging pillars and section structure directly.
- `search_insights` — **what one person said, once, in their own words.** This is the evidence under every claim: `text`, who said it, which company, which conversation, when, and a durable `shareUrl`.

Lead with groups where the workspace has them, then drill to the words. Never re-cluster what Format already clustered.

### Step 1: Orient (1 call)

```
describe_org()   → everything this run needs to calibrate itself
```

One call returns the org that answered, this workspace's `topics` (each with the standing question it asks, its `insightCount` and `groupCount`), the CRM `attributes` you can filter on and the operators each accepts, the connected `sources`, the `coverage` span (`earliestRecordAt` → `latestRecordAt`, `recordCount`, `companyCount`, `personCount` — the numbers the document's header line states), and `processing`.

**Read `processing.hasGroups` before concluding anything.** `true` means this workspace has been through Format's analysis and Step 3 can lead with themes. `false` means nothing here has been gathered into insight groups at all — not that the workspace is thin — and the run proceeds identically from insights, with you doing the clustering in Step 7.

If the connection can reach several Format workspaces, `list_organizations()` names them; every response echoes the `org` that answered, so a wrong default is visible on the first call rather than at the end of the document.

Topic structures vary across Format orgs. Map available topics to the analytical roles below and proceed silently. `topicNames` takes the names `describe_org` returned, case-insensitively; a name that doesn't exist is refused with the full valid list rather than quietly returning nothing.

**Topic role mapping:**

| Analytical role | Candidate topic names (pick closest available) |
|---|---|
| Positive signal / praise | Positive Feedback, Customer Love, Expansion and Contraction Signals (positive) |
| Pain / gaps | Negative Product Feedback, Feature Requests, Feature Requests and Workarounds, Workflow Friction |
| Competitive mentions | Go-to-market Signals, Competitive Intelligence, Competitive Mentions |
| Use cases / onboarding | Customer Onboarding, Implementation Feedback, Use Cases |
| Objections / concerns | Buying Objections, Security & Compliance Concerns, Pricing Concerns |
| Switching signals | Churn Risk Signals, Expansion and Contraction Signals (negative) |

If a topic exists, use it. If not, fall back to semantic queries against all topics (Step 4 shows the shape).

### Step 2: Firmographics & buyer roles (2 calls)

```
list_companies(hasInsights: true, limit: 200)
  → industries, size, plan, etc. come from the `attributes` array (CRM-mapped
    fields — whatever this org has mapped). `totalCount` says how many matched
    in all, so you know whether one page covered the register. Also feeds
    notable customers in Proof Points.

list_persons(hasInsights: true, limit: 200)
  → who actually shows up in conversations; roles from titles/attributes.
    Feeds Decision-makers, Personas, buyer profile in Proof Points.
```

If the org has no CRM attributes mapped (empty `attributes` arrays), don't fabricate firmographics — infer what you can from conversation content and flag the rest as gaps.

### Step 3: Thematic core pass (4 calls, one per analytical role)

One theme query per analytical role. These give the document its spine:

```
search_insight_groups(topicNames: [positive topic], limit: 30)
  → Voice, Proof points, Differentiation, Customer Language (praise)

search_insight_groups(topicNames: [pain topic], limit: 30)
  → Problems, Personas, Switching Dynamics (Push), Customer Language (problem)

search_insight_groups(topicNames: [competitive topic], limit: 30)
  → Competitive landscape, Differentiation, Objections

search_insight_groups(topicNames: [use cases topic, if available], limit: 20)
  → Personas, Target Audience, Product Overview
```

How to read a group: `title` is the theme label, `subtitle` is the claim it makes, `customerCount` and `mentions` size it, `lifecycleState` (Emerging / Growing / Mature / Cooling / Dormant / Extinct) says where it sits in its life and whether it's growing or fading, and `childCount` says whether narrower themes sit beneath it.

Three things about these numbers:

- **`customerCount` ranks; it never sums.** A customer counted in a narrow theme is counted again in every broader theme above it, so adding the column produces a number that double-counts people. Use it to order pillars, never to claim a total.
- **A page can be shorter than its `limit`.** Where themes nest, the page carries the broadest of each nest rather than both — so `count` is what came back and `hasMore` is whether the database had more.
- **Group `id`s are handles for this conversation only.** Format re-clusters, and an id does not survive it — never write one into the document, a saved file, or a scheduled job.

**When `hasGroups` was false**, skip this step's shape and run the same four pulls as `search_insights(topicNames: [...], limit: 50)` instead. `emptyReason` on any empty page tells you which case you're in: `no_groups_yet` (nothing gathered into groups here — go to insights), `filtered_out` (the filter matched nothing — loosen it), `empty_org` (no customer data at all — stop).

### Step 4: JTBD forces pass (3–4 calls)

`semanticQuery` searches individual insights by meaning, so these return the verbatim evidence the Switching Dynamics section is built from:

```
search_insights(semanticQuery: "frustrated with how we do this today, too manual, can't keep up, falling behind", limit: 30)
  → Push (dissatisfaction with current state)

search_insights(semanticQuery: "this is exactly what we needed, finally, game changer", limit: 30)
  → Pull (attraction to the new solution)

search_insights(topicNames: [objections topic], semanticQuery: "worried about switching, security concerns, will it be reliable, not sure about the data", limit: 30)
  → Anxiety (concerns about switching)

search_insights(semanticQuery: "what we already use works fine, good enough, don't need another tool", limit: 20)
  → Habit (inertia — why the existing workflow feels fine)
```

Ordering follows the query: with a `semanticQuery` you get best-match first, without one you get newest first. There is no `orderBy` to set.

### Step 5: Objections pass (1 call)

```
search_insight_groups(topicNames: [objections topic], limit: 30)
```

Feeds the Objections table. Cross-reference with the positive themes from Step 3 to find customer-proof rebuttals for each objection. Where `hasGroups` was false, run the same pull as `search_insights` instead.

### Step 6: Drill where evidence is thin (0–3 calls, as needed)

Every claim in the document needs a verbatim insight behind it. When a theme from Step 3 is load-bearing but you don't yet hold the words for it, drill straight down from the group:

```
search_insights(supportingGroupId: "<the group's id>", limit: 10)
  → every insight gathered under that theme, however deep
```

That is the whole drill — one filter, one call. Two neighbouring moves are worth knowing:

- `get_insight_group(groupId, descendants: 'direct')` walks *sideways and down through themes* rather than to the words, which is what you want when a group's `childCount` is high and you need the sub-themes before the evidence.
- `find_similar_insights(insightId)` reaches out from one strong insight to others near it — Format's own clustering where it exists, wording similarity where it doesn't.

Budget these — drill only for themes that anchor a section (top pain, top differentiator, headline switching force).

### Step 7: Synthesize

All fourteen sections built from the extracted pool. No additional tool calls needed.

**Themes come pre-clustered — use them.** In the Customer Language section, do NOT dump a list of unrelated lines. Where the workspace had insight groups, the clustering is already done: use each group's `title`/`subtitle` as the bolded theme label and the insights you drilled from it as members. Where a topic returned only insights, cluster them yourself into 3–5 themes per subsection. Example shape either way:

> **"We're data rich and insight poor"**
> - "[verbatim]" — [Name], [Company]
> - "[verbatim]" — [Name], [Company]
>
> **"Insights get filtered and distorted"**
> - "[verbatim]" — [Name], [Company]

This is the product-marketer move — it turns scattered evidence into reusable messaging pillars.

**Use lifecycle as the editorial signal.** A `Growing` theme belongs higher in its section than a `Cooling` one of equal size; say so in the prose ("rising fast this quarter"). Themes that are Dormant/Extinct still count for retrospective sections — don't silently drop them. On refresh runs, lifecycle shifts are exactly what "What changed since last refresh" should report.

**Flag gaps honestly.** Some sections can only be partially filled from customer conversations. Mark them clearly rather than fabricating:

| Section | Usually well-covered by Format | Usually needs founder input |
|---|---|---|
| Product overview | What it does, category | One-liner, business model, pricing |
| Target audience & JTBD | Jobs, use cases | Stage cutoffs, ICP boundaries |
| ICP | Triggers, roles, industries | Firmographic ranges, funding stage |
| Personas | Pains, language, roles | Decision authority, budget authority |
| Problems & pain points | All of it | — |
| Competitive landscape | Who's mentioned, how framed | Strategic categorization |
| Differentiation | What customers say is different | Founder's intended positioning |
| Objections | Actual objections raised | Rebuttals for unhandled objections |
| Anti-persona | Stalled deals, bad fits | Explicit exclusion rules |
| Switching dynamics | All four forces | — |
| Customer language | All of it | — |
| Brand voice | All of it | — |
| Proof points | Testimonials, themes | Hard metrics (revenue, hours saved) |
| Last refreshed | Date, what changed | — |

Where a subsection has no data support, write:

> *Gap — founder input needed. Format data doesn't cover this. Paste your [homepage / pricing page / one-liner / founder description] and I can enrich this section.*

Do not guess. Do not fill with generic B2B copy. An honest gap is better than a made-up answer.

### Step 8: Offer enrichment (after delivering the doc)

At the very end of the response — after the document has been delivered — append a single short prompt:

> *Want to fill the gaps? Paste any of these and I'll enrich the relevant sections: your homepage URL, pricing page, one-liner, or founder's description of the business.*

Keep it to one line. Don't elaborate. The user either responds with URLs/text (and you enrich) or they don't (and the doc stands as-is).

---

## Adaptation rules

**Small conversation pool (<150 insights).** Deliver what's supportable. Switching Dynamics may be thin — that's fine, flag it. Do not fabricate personas or forces that aren't in the data.

**No insight groups yet.** A workspace Format hasn't finished analysing reports `processing.hasGroups: false`, and `search_insight_groups` answers with `emptyReason: "no_groups_yet"`. The run works identically from `search_insights`; you just do the thematic clustering yourself in Step 7. Never report "no data" off the back of an empty group search — that response says nothing about the question you asked.

**Different topic names.** Map silently via the topic role table. Don't surface the mapping to the user.

**Heavy prospect skew.** If most conversations are pre-sales discovery, treat "high-intent prospects who chose us" as the primary cohort. Switching Dynamics still applies — these prospects are switching from something (even if that something is "nothing" / manual).

**Single-vertical customer base.** Write ICP and personas for the vertical that's actually winning. Don't hedge with "B2B companies broadly."

**Sparse competitive mentions.** If fewer than 5 competitors appear in conversations, present a simple list rather than the high/medium/low risk structure. Flag the rest as a gap.

---

## Deliverable format

See `references/document-template.md` for the exact structure, section headers, and formatting rules.

**The header states the data window.** Right under the title, one line: how many conversations and insights the document draws on AND the period they span (earliest → latest read from the data, e.g. "~6,400 conversations, March 2025 – June 2026"). A count without a period is the single most-asked follow-up question from readers — answer it before it's asked.

**Every claim in the document must be evidence-backed or flagged as a gap.** Every persona pain point cites a verbatim insight. Every value theme cites one. Every voice characteristic cites one. Every JTBD force cites 2–3. If there's nothing in the data to support a claim, either mark it as a gap or omit it. Never fabricate.

**Voice rules:**
- Direct, specific, no hedging
- No generic B2B phrases ("industry-leading", "best-in-class", "enterprise-grade")
- Use customer language, not marketing language
- Verbatim stays verbatim — don't polish what customers said
- Thematic clusters in Customer Language, never an undifferentiated list
- Link every attribution to the insight's `shareUrl` so teammates can jump to the source conversation

**File output:**
- Save as `company-context.md` using your environment's file mechanism; inline the same content in chat so the user sees it immediately
- On a refresh run (the user shares or has a previous `company-context.md`), diff against it and put "What changed since last refresh" near the top
- Add the single-line enrichment prompt (Step 8) at the end

---

## Enrichment mode

If the user responds to the enrichment prompt by pasting a URL, pricing info, or a founder-written description:

1. If it's a URL and your environment can fetch web pages, fetch it; otherwise ask the user to paste the relevant text
2. Re-read the existing `company-context.md`
3. Fill in the gap-flagged sections using the pasted / fetched content
4. Preserve all Format-grounded sections verbatim — do not rewrite them
5. Mark enriched sections with a small note: *Enriched from [homepage / founder input / pricing page] on [date].*
6. Deliver the updated file again

Enrichment content is secondary to customer data. Where they conflict, customer data wins — because the whole point is to ground context in what customers actually say, not what the website claims.

---

## Anti-patterns

**Don't** open with "I'll now analyze your Format workspace..." → start with the tool call.
**Don't** narrate each step → the UI shows the tool calls.
**Don't** dump partial findings and ask to continue → scope narrower and finish in one response.
**Don't** invent generic personas not grounded in the data.
**Don't** write aspirational brand voice — extract what's actually there.
**Don't** fill data-thin sections with generic B2B copy — flag them as gaps instead.
**Don't** dump an undifferentiated list in the Customer Language section — use the insight groups (or cluster yourself) with bolded theme labels.
**Don't** re-cluster what Format already clustered — insight groups ARE the themes; drill them with `supportingGroupId` for evidence instead.
**Don't** treat an empty `search_insight_groups` as "no data" — read `emptyReason`, and answer from `search_insights` when it says `no_groups_yet`.
**Don't** filter by `lifecycleStates` — lifecycle is context for the prose, not a precondition. Dormant themes are real.
**Don't** sum `customerCount` across themes — it ranks, it never totals; nested themes count the same customer more than once.
**Don't** invent parameters. Tool schemas are strict: an unrecognised key fails the call by name instead of being quietly dropped, so a mistyped filter is loud rather than silently unfiltered.
**Don't** auto-fetch the website on the first run — only fetch in enrichment mode when the user explicitly shares a URL.
**Don't** re-ask for the org ID or any config — the Format MCP defaults to the user's primary workspace.
**Don't** let website copy override what customers actually said during enrichment — customer data always wins.
**Don't** skip the Switching Dynamics section — it's one of the most valuable and Format data almost always supports it.
