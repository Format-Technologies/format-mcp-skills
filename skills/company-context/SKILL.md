---
name: company-context
description: Use when a team wants to generate a shared company context document — the foundational brief on their positioning, ICP, personas, voice, and proof points — grounded in real customer conversations from their Format workspace. Trigger phrases include "build our voice-of-customer doc", "build our company context", "generate our shared context", "create a company brief", "what's our positioning", "who are we really selling to", "extract our brand voice", "what do customers say about us", "build shared context for our team", "one source of truth for marketing", "generate our product marketing context", or "refresh our positioning doc". Uses the Format MCP to produce a single markdown document covering product overview, ICP, personas, pain points, competitive landscape, brand voice, and proof points — all backed by verbatim customer quotes. Runs end-to-end in one response. Re-run quarterly to refresh as the customer base evolves. Not for writing blog posts, emails, ads, or case studies — those are downstream skills that read this context. For a targeting-focused ICP deep-dive (prospect criteria, qualification filters), use defining-your-icp instead.
metadata:
  title: Voice-of-Customer Context for AI
  personas: [customer-success, sales, marketing, product, leadership, research]
  image: card.png
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
10. **Switching dynamics (JTBD forces)** — Push / Pull / Habit / Anxiety, each with verbatim quotes
11. **Customer language** — how they describe the problem (thematic clusters), how they describe the product, words to use, words to avoid, glossary
12. **Brand voice** — tone, style, personality with evidence quotes
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
- A targeting-focused ICP deep-dive (prospect list criteria, qualification filters, seed accounts) — that's `defining-your-icp`; this document is the broad foundation it sits on

## Setup

If Format MCP isn't connected yet:
1. Settings → Connectors → Add custom connector
2. URL: `https://useformat.ai/api/mcp`
3. Authenticate with your Format account

No configuration needed beyond that. The skill queries whatever Format workspace the MCP is connected to.

---

## The run — how the skill executes

Tight sequence. Target: 12–16 tool calls total. **Aggregated-first:** Format's quant pipeline pre-clusters customer quotes into themes (aggregated answers). Wherever possible, query at `level: 'any'` so you get those themes — with mention counts, distinct-customer counts, direction, and lifecycle — instead of re-clustering raw quotes yourself. Topics that haven't been aggregated yet automatically fall back to verbatim quotes in the same call.

### Step 1: Orient (2 calls)

```
list_organizations()  → confirm orgId (defaults to your primary org)
list_topics(orgId)    → see what's actually in this workspace
```

Topic structures vary across Format orgs. Map available topics to the analytical roles below and proceed silently.

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
list_companies(orgId, hasInsights: true, limit: 200)
  → industries, size, plan, etc. come from the `attributes` array (CRM-mapped
    fields — whatever this org has mapped). Also feeds notable customers in
    Proof Points.

list_persons(orgId, hasInsights: true, limit: 200)
  → who actually shows up in conversations; roles from titles/attributes.
    Feeds Decision-makers, Personas, buyer profile in Proof Points.
```

If the org has no CRM attributes mapped (empty `attributes` arrays), don't fabricate firmographics — infer what you can from conversation content and flag the rest as gaps.

### Step 3: Thematic core pass (4 calls, one per analytical role)

One aggregated-first query per role. These feed most of the document:

```
search_insights(orgId, topicNames: [positive topic], level: 'any', select: "default", limit: 50)
  → Voice, Proof points, Differentiation, Customer Language (praise)

search_insights(orgId, topicNames: [pain topic], level: 'any', select: "default", limit: 50)
  → Problems, Personas, Switching Dynamics (Push), Customer Language (problem)

search_insights(orgId, topicNames: [competitive topic], level: 'any', select: "default", limit: 50)
  → Competitive landscape, Differentiation, Objections

search_insights(orgId, topicNames: [use cases topic, if available], level: 'any', select: "default", limit: 40)
  → Personas, Target Audience, Product Overview
```

Read the results by level:

- **Aggregated answers** (anything above level 0) are pre-built themes: `title` is the theme label, `subtitle` is the synthesized claim, `customerCount`/`mentions` size it, `direction` says whether it's growing or fading, `lifecycleState` says where it sits in its life. These become your messaging pillars and section structure directly.
- **Verbatim quotes** (level 0) are evidence. Each carries a `shareUrl` — when attributing a quote in the document, link the attribution to it so teammates can jump to the source conversation.

### Step 4: JTBD forces pass (3–4 calls)

Semantic queries are level-0-only (embeddings live on individual quotes), so these return verbatim evidence for the Switching Dynamics section:

```
search_insights(orgId, semanticQuery: "frustrated with how we do this today, too manual, can't keep up, falling behind", level: 0, select: "default", limit: 30)
  → Push (dissatisfaction with current state)

search_insights(orgId, semanticQuery: "this is exactly what we needed, finally, game changer", level: 0, select: "default", limit: 30)
  → Pull (attraction to the new solution)

search_insights(orgId, topicNames: [objections topic], semanticQuery: "worried about switching, security concerns, will it be reliable, not sure about the data", level: 0, select: "default", limit: 30)
  → Anxiety (concerns about switching)

search_insights(orgId, semanticQuery: "what we already use works fine, good enough, don't need another tool", level: 0, select: "default", limit: 20)
  → Habit (inertia — why the existing workflow feels fine)
```

### Step 5: Objections pass (1 call)

```
search_insights(orgId, topicNames: [objections topic], level: 'any', select: "default", limit: 40)
```

Feeds the Objections table. Cross-reference with the positive themes from Step 3 to find customer-proof rebuttals for each objection.

### Step 6: Drill where evidence is thin (0–3 calls, as needed)

Every claim in the document needs a verbatim quote behind it. When an aggregated theme from Step 3 is load-bearing but you don't yet hold quotes for it, drill in:

```
search_insights(orgId, insightIds: [the answer's id], level: 'aggregated', select: "extended")
  → exposes supportingInsightIds
search_insights(orgId, insightIds: [supportingInsightIds], level: 0, select: "default", limit: 10)
  → the underlying verbatim quotes
```

Budget these — drill only for themes that anchor a section (top pain, top differentiator, headline switching force).

### Step 7: Synthesize

All fourteen sections built from the extracted pool. No additional tool calls needed.

**Themes come pre-clustered — use them.** In the Customer Language section, do NOT dump random quotes. Where the workspace had aggregated answers, the clustering is already done: use each answer's `title`/`subtitle` as the bolded theme label and its drilled quotes as members. Where a topic only returned verbatim quotes, cluster them yourself into 3–5 themes per subsection. Example shape either way:

> **"We're data rich and insight poor"**
> - "[Quote 1]" — [Name], [Company]
> - "[Quote 2]" — [Name], [Company]
>
> **"Insights get filtered and distorted"**
> - "[Quote 1]" — [Name], [Company]

This is the product-marketer move — it turns raw quotes into reusable messaging pillars.

**Use direction and lifecycle as editorial signals.** A theme with `direction: growing` belongs higher in its section than a Cooling one of equal size; say so in the prose ("rising fast this quarter"). Themes that are Dormant/Extinct still count for retrospective sections — don't silently drop them. On refresh runs, direction shifts are exactly what "What changed since last refresh" should report.

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

**Small conversation pool (<150 quotes).** Deliver what's supportable. Switching Dynamics may be thin — that's fine, flag it. Do not fabricate personas or forces that aren't in the data.

**No aggregated answers yet.** A workspace whose topics haven't been through the quant pipeline returns only verbatim quotes at `level: 'any'` — the run works identically; you just do the thematic clustering yourself in Step 7. Never report "no data" off the back of an empty `level: 'aggregated'` call.

**Different topic names.** Map silently via the topic role table. Don't surface the mapping to the user.

**Heavy prospect skew.** If most conversations are pre-sales discovery, treat "high-intent prospects who chose us" as the primary cohort. Switching Dynamics still applies — these prospects are switching from something (even if that something is "nothing" / manual).

**Single-vertical customer base.** Write ICP and personas for the vertical that's actually winning. Don't hedge with "B2B companies broadly."

**Sparse competitive mentions.** If fewer than 5 competitors appear in conversations, present a simple list rather than the high/medium/low risk structure. Flag the rest as a gap.

---

## Deliverable format

See `references/document-template.md` for the exact structure, section headers, and formatting rules.

**Every claim in the document must be evidence-backed or flagged as a gap.** Every persona pain point has a verbatim customer quote. Every value theme has a quote. Every voice characteristic has a quote. Every JTBD force has 2–3 quotes. If there's no quote to support a claim, either mark it as a gap or omit it. Never fabricate.

**Voice rules:**
- Direct, specific, no hedging
- No generic B2B phrases ("industry-leading", "best-in-class", "enterprise-grade")
- Use customer language, not marketing language
- Quotes stay verbatim — don't polish them
- Thematic clusters in Customer Language, not quote dumps
- Where a quote came back with a `shareUrl`, link the attribution to it

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
**Don't** dump random quotes in the Customer Language section — use the aggregated themes (or cluster yourself) with bolded theme labels.
**Don't** re-cluster what the quant pipeline already clustered — aggregated answers ARE the themes; drill them for evidence instead.
**Don't** treat an empty `level: 'aggregated'` result as "no data" — retry at `level: 'any'` or `level: 0` and answer from quotes.
**Don't** filter by `lifecycleStates` — lifecycle is context for the prose, not a precondition. Dormant themes are real.
**Don't** auto-fetch the website on the first run — only fetch in enrichment mode when the user explicitly shares a URL.
**Don't** re-ask for the org ID or any config — the Format MCP defaults to the user's primary workspace.
**Don't** let website copy override customer quotes during enrichment — customer data always wins.
**Don't** skip the Switching Dynamics section — it's one of the most valuable and Format data almost always supports it.
