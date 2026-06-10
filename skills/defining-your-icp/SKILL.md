---
name: defining-your-icp
description: Use when defining, refining, or analysing the Ideal Customer Profile (ICP), identifying best-fit buyers, extracting buyer personas, or building target account criteria from customer conversation data. Trigger phrases include "define our ICP", "build an ICP", "who are our best customers", "who should we target", "build a persona", "what do our best buyers have in common", "win/loss from calls", and "build a target account list from customer data". This skill uses the Format MCP to produce an ICP snapshot, prospect list criteria, persona breakdowns, in-market language cues, and a competitive landscape — a cross-functional document for sales, marketing, paid ads, product, and leadership. Runs end-to-end silently without asking the user to configure anything upfront. Does not produce cold email copy, ad creative, or landing page copy — those are downstream skills.
metadata:
  title: Define Your ICP
  personas: [marketing, sales, leadership]
  image: card.jpg
  use_case: >-
    Build an evidence-backed Ideal Customer Profile from real customer
    conversations: an ICP snapshot, buyer personas, in-market language cues,
    target-account criteria, and the competitive landscape — one document the
    whole go-to-market team can work from.
  limitations: >-
    Needs a meaningful base of conversations in Format to be representative.
    Doesn't produce cold-email copy, ad creative, or landing pages — those are
    downstream skills.
  prompts:
    - "Define our ICP from the last 6 months of customer conversations."
    - "What do our best customers have in common?"
---

# Defining Your ICP

## Execution principle

This skill runs silently and completes in a single response. When invoked, Claude's immediate next action is a tool call — not a chat message. No opening statement, no progress narration, no interim findings, no mid-run bailouts, no "want me to continue?" prompts. The user sees tool calls rendered by the UI; Claude's next chat output is the finished deliverable.

If the full analysis can't fit in one turn, narrow the scope silently — but always complete a usable deliverable in one response. Never dump partial findings as an interim summary and ask to continue.

The document is the deliverable. Everything else is noise.

---

## What this skill produces

A cross-functional ICP document delivered two ways — inline in chat so the user can read it immediately, and as a downloadable markdown file they can save to Notion, Google Docs, a shared drive, or wherever their team works.

The document has five sections:

1. **ICP snapshot** — who the company sells to, in one page. For leadership, marketing, and anyone who needs the high-level answer.
2. **Prospect list criteria** — primary / secondary / exclude filters, triggers, disqualifiers, and seed accounts. For sales, SDRs, paid ads.
3. **Buyer personas** — three archetypes with day-to-day reality, what they care about, and where to find them. For sales, marketing, content, paid ads.
4. **In-market language bank** — verbatim quotes that indicate an account is ready to buy. For sales qualification, SDR prospecting, marketing keyword research.
5. **Competitive landscape** — who's in the account and how customers talk about them. For positioning, qualification, paid ads exclusions.

One document, read differently by different teams. Section headers use the human labels — never label sections as "Artifact 1, Artifact 2," etc.

---

## When to use

- Before launching a new outbound motion
- After reaching product-market fit but before scaling
- When entering a new segment or vertical
- When the customer base has evolved and old assumptions are stale
- As part of quarterly ICP reviews

## When NOT to use

- Fewer than 50 conversations in Format — not enough signal yet
- Defining ICP from scratch with no existing customers — needs discovery interviews first
- Writing cold email copy or ad creative — downstream skills handle those

## Setup

If Format MCP isn't connected yet:
1. Settings → Connectors → Add custom connector
2. URL: `https://useformat.ai/api/mcp`
3. Authenticate with your Format account

---

## The run — how the skill executes

Tight sequence. Target: 10–12 tool calls total. Broad topic-first queries, not over-filtered semantic queries.

### Step 1: Orient (2 calls)

```
list_organizations()  → get orgId
list_topics(orgId)    → see what's actually in this Format workspace
```

Topic structures vary across Format orgs. Map the available topics to the roles below and proceed. Do not surface this mapping to the user.

**Topic role mapping:**

| Analytical role | Candidate topic names (pick closest available) |
|---|---|
| Best cohort signal | Expansion and Contraction Signals (positive), Customer Love, Positive Feedback |
| Worst cohort signal | Expansion and Contraction Signals (negative), Buying Objections, Negative Product Feedback, Churn Risk Signals |
| Competitive / in-market | Go-to-market Signals, Competitive Intelligence, Competitive Mentions |
| Product gaps | Feature Requests, Product Issues, Feature Requests and Workarounds |
| Onboarding / use cases | Customer Onboarding, Implementation Feedback |

If the workspace has the topic, use it. If not, fall back to semantic queries against all topics.

### Step 2: Build Best and Worst cohorts (2 calls)

**Best cohort** — positive-signal topic, no narrow sentiment filter:
```
search_insights(
  orgId,
  topicNames: [best-cohort topic],
  select: "default",
  limit: 75
)
```

**Worst cohort** — worst-signal topic:
```
search_insights(
  orgId,
  topicNames: [worst-cohort topic],
  select: "default",
  limit: 75
)
```

Extract unique company names from each. Dedupe companies appearing in both.

### Step 3: Resolve companies, firmographics and roles (2 calls)

```
list_companies(orgId, hasInsights: true, limit: 200)
  → match Best/Worst cohort names to company records: IDs (needed for Step 4
    filters) + the attributes array (CRM-mapped fields like industry, plan,
    company size — whatever this org has mapped)

list_persons(orgId, companyIds: [Best cohort company IDs], hasInsights: true, limit: 200)
  → who actually shows up in the conversations; roles from titles/attributes
```

Two calls. Enough to see dominant industry and dominant buyer role. If the org
has no CRM attributes mapped (empty `attributes` arrays), don't fabricate
firmographics — infer what you can from the conversation content pulled in
Step 4 and say so in the document.

### Step 4: Core content extraction (4–5 calls)

Pull the substance for ICP snapshot, personas, in-market signals, competitive landscape with broad queries against the Best cohort. Do not run separate framework passes.

**Why customers chose them** (feeds ICP snapshot + competitive landscape):
```
search_insights(
  orgId,
  topicNames: [competitive/in-market topic],
  companyIds: [Best cohort company IDs],
  select: "default",
  limit: 40
)
```

**Pains and what's broken** (feeds ICP snapshot, personas, in-market signals):
```
search_insights(
  orgId,
  topicNames: [product gaps topic],
  companyIds: [Best cohort company IDs],
  select: "default",
  limit: 40
)
```

**Value realized** (feeds ICP snapshot, personas):
```
search_insights(
  orgId,
  topicNames: [best-cohort topic],
  companyIds: [Best cohort company IDs],
  select: "default",
  limit: 40
)
```

**Onboarding / use case patterns** (feeds personas):
```
search_insights(
  orgId,
  topicNames: [onboarding topic, if available],
  companyIds: [Best cohort company IDs],
  select: "default",
  limit: 30
)
```

**Disqualifier content** (feeds Not-Fit account list):
```
search_insights(
  orgId,
  topicNames: [worst-cohort topic],
  select: "default",
  limit: 40
)
```

4–5 calls. Combined with orientation and cohort-building: 8–11 total.

### Step 5: Synthesize

All five sections built from the pool of extracted insights above. No additional tool calls needed.

---

## Adaptation rules

**Small cohort (<15 Best cohort companies).** Deliver what's supportable. Note (in the "why this ICP, not another" section, not in a methodology note) that confidence would grow with more data.

**Different topic names.** Map silently via the topic role table above.

**Heavy prospect skew (mostly pre-sales conversations).** Treat "high-intent prospects who chose us" as the Best cohort. The analysis is about who fits, not how long they've been customers.

**Different verticals (HR-tech, dev-tools, vertical SaaS, etc).** Trigger language varies. Use customer's own words from the data, not generic B2B phrases.

---

## The deliverable — five sections

**Two outputs every run:**

1. **Inline in chat** — the full document rendered so the user can read it immediately.
2. **A markdown file** — the same document saved as `[company-slug]-icp.md`, delivered however your environment shares files (a download link on claude.ai, a file written to the working directory in Claude Code or Cursor). If your environment can't produce files, skip this and deliver inline only.

The markdown file is important. A GTM source-of-truth document needs to live somewhere — Notion, Coda, Google Docs, a shared drive — not buried in a chat history. Markdown pastes cleanly into every modern tool and preserves the tables.

### How to produce the file

After completing the analysis:

1. Save the full document as `[company-slug]-icp.md` using your environment's file mechanism (on claude.ai: write to the outputs directory and present the file; in Claude Code/Cursor: write it to the working directory).
2. Use the same content for the inline chat response — do not abbreviate either version.

The company slug should be lowercase with hyphens — "Kota" becomes `kota`, "Acme Corp" becomes `acme-corp`.

### Document structure

Both the inline version and the file use this structure:

```
# [Company] ICP

*This document is the source of truth on who [Company] sells to. Sales pulls the prospect criteria and qualification framework. Marketing grabs the personas and in-market language. Paid ads grabs the filters and exclusions. Product grabs what buyers want and can't get elsewhere. Leadership grabs the snapshot and competitive landscape.*

---

## 1. ICP snapshot
[content]

---

## 2. Prospect list criteria
[content]

---

## 3. Personas
[content]

---

## 4. In-market language bank
[content]

---

## 5. Competitive landscape
[content]
```

Numbered section headers (1. 2. 3. 4. 5.) are fine and help scanning. Section names use the human labels: *ICP snapshot, Prospect list criteria, Personas, In-market language bank, Competitive landscape*.

### ICP snapshot

Framing subtitle, summary table, narrative paragraph, and a "why this ICP" note. No TAM definition at the top — that's a separate concept from this skill's scope, and cramming it in at the top adds weight without helping.

**Open with an italicised one-liner subtitle:**

```
*This document is the source of truth on who [Company] sells to. Sales pulls the prospect criteria and qualification framework. Marketing grabs the personas and in-market language. Paid ads grabs the filters and exclusions. Product grabs what buyers want and can't get elsewhere. Leadership grabs the snapshot and competitive landscape.*
```

**Summary table — 8 rows, specific not generic:**

| Dimension | Profile |
|---|---|
| Primary geography | [Primary regions — mark mandatory vs. pull. E.g. "Ireland + UK (mandatory). Growing pull from EU/global distributed teams."] |
| Company size | [Employee range with sweet spot, plus *why* above/below doesn't work — e.g. "30–500 (sweet spot 50–250). Below 30 = price-sensitive. Above 500 = RFP-heavy and slow."] |
| Stage & funding | [E.g. "Seed–Series C scaleups AND mid-market private businesses (agencies, legal, pharma)"] |
| Vertical breadth | [Named examples across verticals — e.g. "Not vertical-specific. Wins span SaaS (A, B, C), agencies (X, Y), fintech (P, Q), pharma (R, S)..."] |
| Tech stack (strong fit) | [Specific tools that indicate fit — e.g. "HiBob, Bamboo, Rippling, Workday (fragmented regions), Deel (as EOR pass-through)"] |
| Buyer | [Exact roles + who signs — e.g. "Head of People / People Ops — *always* the economic champion. CFO is the approver."] |
| Headcount/timing trigger | [Observable events — e.g. "Recent acquisition, international expansion, scale from 30 to 100+, new HR hire inherits fragmented setup, renewal 60–90 days out"] |
| Emotional state | [Actual emotional language from data in quote marks — e.g. "'I'm the benefits system.' Spreadsheet fatigue. Embarrassed by the employee experience."] |

The **Emotional state** row is what separates this from a generic ICP doc. Pull real customer phrases into it.

**Narrative paragraph (5–7 sentences, prose only, no bullets):**

Cover, in order:
1. Who they are as a company and what triggers the purchase
2. Their current setup and what's broken about it
3. Their existing tech stack and what integration means to them
4. What alternatives they've looked at and why those fell short
5. **The wedge** — the specific thing the company does that no alternative does
6. Where the ceiling is (above which the deal breaks) and where the floor is (below which the pain isn't acute enough)

No framework jargon. No bullet points inside the paragraph. This reads like a strategist wrote it.

**Why this ICP, not another (2–3 sentences):**

Name the *overlap*, not just exclusions. Example structure:
- "Kota wins when the buyer has pain on both sides — broker AND platform. Pure-platform buyers (enterprise) won't switch for UX alone. Pure-broker buyers (under 30 employees, single country) don't value the platform and balk at cost. The ICP is the overlap."

This framing is stronger than "we exclude X, Y, Z" because it explains *why* the ICP is narrow, not just that it is.

---

### Target account criteria

Four components: a single Primary/Secondary/Exclude criteria table, a short disqualifier list with named examples, a seed accounts paragraph, and in-market trigger signals.

**Primary / Secondary / Exclude table:**

| Criteria | Primary (go hard) | Secondary (worth testing) | Exclude |
|---|---|---|---|
| HQ / employee base | [Primary regions] | [Secondary regions or mixed footprints] | [Regions that don't work] |
| Employee count | [Tight sweet-spot range] | [Wider acceptable range] | [Sizes that don't work + one-line reason] |
| Tech stack in use | [HRIS / ops tools that signal strong fit] | [Tools that work but aren't primary signal] | [Stacks that indicate misfit] |
| Current setup / status quo | [What the prospect currently uses that creates buying pressure] | [Adjacent setups worth testing] | [Setups that mean no pain yet, or locked-in pain] |
| Trigger events | [Observable events — funding, hire, expansion, renewal] | [Softer signals — growth rate, job posts] | — |
| Industry | [Named verticals that show up in Best cohort] | [Adjacent verticals worth testing] | [Verticals that never convert — named] |
| Buyer signal | [Exact titles identifiable on LinkedIn] | [Adjacent titles] | [Titles that aren't the buyer] |

**Disqualifiers (hard stops) — as a short list with named-account patterns:**

Not a separate table — a prose list of 4–6 bullets, each naming a real example from the data so sales recognises the pattern:

- [Disqualifier 1] ([Named Account] pattern)
- [Disqualifier 2] ([Named Account] pattern)
- [Disqualifier 3] ([Named Account] pattern)

This format makes the list usable — sales hears "oh, this feels like a Sons UK pattern" and knows to disqualify.

**Seed accounts — a single comma-separated paragraph, not a table:**

```
Use these to generate lookalikes: **[Company 1], [Company 2], [Company 3], [Company 4], [Company 5]...**
```

15–30 companies, bolded, comma-separated, one paragraph. This format pastes cleanly into Apollo/Sales Nav/Clay as a lookalike seed list. A table is harder to lift.

**In-market trigger signals — short bulleted list:**

For SDRs and paid ads retargeting. Observable patterns:

- New [role] hire announcement on LinkedIn
- "Hiring in [region]" posts from [primary-region] HQ
- [Partner/integration] customer base (warm inbound signal)
- Job postings for [specific title pattern]
- Announcements of [trigger event — acquisition / funding / expansion]
- Company listed as customer of [displaceable incumbents]

---

### Buyer personas

**Open with one honest framing sentence** about the buying committee structure before the persona table. Example:

> "[Company]'s buying committee is small: one champion, sometimes one finance co-signer, sometimes one IT/ops person. Everything hinges on Persona 1."

This signals the hierarchy honestly. Three personas of equal weight reads as a lie.

**Persona table — three personas maximum, rich rows:**

| Field | Persona 1 | Persona 2 | Persona 3 |
|---|---|---|---|
| Name | **[Memorable plain-English name with a clear archetype]** | [...] | [...] |
| Titles | [4–6 title variations this persona goes by] | [...] | [...] |
| Example people (from data) | [6–10 Name (Company) pairs pulled from best cohort] | [typically fewer named — often unnamed if secondary persona] | [may be 1–2 examples or "typically unnamed"] |
| Company context | [Size range, team structure, where they sit organisationally] | [...] | [...] |
| Day-to-day reality | [What their actual job looks like — specific hours/tasks, not abstractions] | [...] | [...] |
| What they own | [Scope of their responsibility in specific terms] | [...] | [...] |
| What they care about | [Top 3 priorities, specific] | [...] | [...] |
| What's broken (their words) | [Verbatim quotes from data, slash-separated — e.g. "I'm the benefits system." / "Everything's on Excel."] | [...] | [...] |
| What they want | [Top outcomes in their language] | [...] | [...] |
| What they worry about | [Stall-the-deal anxieties, specific] | [...] | [...] |
| Where they hang out | [LinkedIn communities, Slack groups, podcasts, events — channels to reach them] | [...] | [...] |
| Content that resonates | [What content format lands with this persona — e.g. "before/after operational walkthroughs, HRIS integration demos, benchmarking data"] | [...] | [...] |

**The two rows that make this artifact usable for marketing, not just sales:**
- **What's broken (their words)** — verbatim quotes with slashes between them give marketers drop-in headline material
- **Content that resonates** — tells content and marketing teams exactly what formats to produce for this persona

**The Example people row matters too.** Pulling real Name (Company) pairs from the best cohort makes the persona concrete. If sales or marketing wants to validate the persona, they can go look at those people's LinkedIn profiles.

---

### In-market language bank

Rename the section **"In-market language bank"** — that framing reads better than "signals" to a GTM audience.

**Opening line:**

> "Verbatim or near-verbatim phrases from best-fit [Company] buyers. If a prospect says any of these, they're already qualifying themselves."

**Table — 10–14 rows, slash-grouped phrases:**

| Signal phrase | What it tells you | Who uses it |
|---|---|---|
| "[Quote A]" / "[Quote B variation]" / "[Quote C variation]" | [What this pattern signals — specific, not abstract] | [Persona + 1–3 named examples, e.g. "People Ops champion (Ghena at OakNorth, Lorraine at Volta)"] |
| "[Quote]" / "[variation]" | [signal] | [persona + named examples] |

Three things that make this format work:

1. **Slash-grouped variations in a single row** — instead of one row per quote, group 2–4 variations of the same pattern. This compresses the table and shows the pattern is widespread.
2. **"Who uses it" column names real people from the data** — not just the persona archetype. "People Ops champion (Ghena at OakNorth)" is more useful than "Sales qualifies."
3. **"What it tells you" is specific and actionable** — "Displaceable broker relationship — Kota's wedge" is better than "Ready to buy."

---

### Competitive landscape

**Table — 6–10 rows, covering both named competitors and non-obvious alternatives (status quo, adjacent categories):**

| Competitor / alternative | Where it shows up | How best-fit customers describe it | Displaceable? |
|---|---|---|---|
| **[Competitor 1]** | [Frequency + context — e.g. "Mentioned in ~40% of evaluations. Strong UI, strong with UK mid-market, 250+ employee minimum."] | ["Quote 1" / "quote 2" / "quote 3" — slash-separated verbatim patterns] | **[High/Medium/Low]** — [one-line reason + specific condition, e.g. "customers love the interface but hit the integration wall. Kota wins with 'both broker AND platform' pitch."] |
| [...] | [...] | [...] | [...] |

Three things to include:

1. **Rows for NAMED competitors** (Thanks Ben, Ben, Benifex, Boost Works, etc.)
2. **Rows for LEGACY/ENTERPRISE incumbents** (Mercer, Aon, Lockton, etc.) — often the real competition, not the named SaaS alternatives
3. **Rows for NON-OBVIOUS alternatives:**
   - Adjacent category tools that get confused with the product (e.g. "Reward Gateway / Perkbox / Vivup — Discount/perks platforms, not benefits admin")
   - Status quo as an explicit row: "Spreadsheets + email + multiple provider portals — the actual incumbent in ~50% of deals"
   - HRIS-native alternatives that might be perceived as competitors but aren't

The Displaceable column should be a paragraph per row, not just "High/Medium/Low." Include:
- **When it's displaceable** (specific conditions)
- **When it's not** (specific conditions)
- **Kota's angle against it** (the specific wedge)

Example of a rich Displaceable entry:
> "**High for mid-market (50–500 employees), Low for large enterprise.** Best wedge: 'we ARE the regulated broker — and we also give you the platform.'"

This is more useful than a single word rating because it tells sales exactly when to fight and when to walk away.

---

### Close with next-steps offer

After the full document is displayed inline, add the next-steps offer as a single sentence picking 3–4 from this standard menu (do not invent custom options based on findings):

1. Pull a live prospect list in Apollo/Clay/Sales Nav from the ICP criteria
2. Draft persona-specific outbound templates
3. Build an SDR qualification framework from the triggers and disqualifiers
4. Brief marketing on positioning and landing page updates from the personas
5. Run win/loss on specific deals
6. Set up a monthly ICP refresh cadence

One sentence. Do not follow it with a methodology note.

**Explicitly banned at the end of the deliverable:**
- "Note: I defined the best cohort using..."
- "I used a hybrid of X signals because..."
- "If you'd rather base this on... say the word and I'll rerun"
- Any assumption check, calibration note, or explanation of how cohorts were constructed

### Final step: present the file

After the next-steps offer, surface the saved `.md` file (download link or file path, per your environment). Example:

On claude.ai: write the file to the outputs directory and present it so a
download link renders. In Claude Code or Cursor: write `kota-icp.md` to the
working directory and state the path in one line.

No commentary around the file presentation. The user sees the file, and can
save the document to Notion or their shared drive.

The run is complete after the file is presented. Nothing follows it.

---

## Scope boundaries

- Runs silently, completes in one response
- Uses tables throughout — no bulleted prose deliverables
- No methodology narration anywhere in the output — including the end
- No framework names (JTBD, Four Forces, positioning frameworks) in the output
- No section labels like "Artifact 1" — use human names only
- No cold email copy, subject lines, ad creative, or landing page copy — those are downstream skills

## Quality bar before shipping

- Zero chat output between the user's request and the ICP snapshot
- All five sections present (or scope narrowed with a one-line note, not a "continue?" bail-out)
- Every section uses tables as the primary structure
- ICP snapshot stands alone — could be pasted into a positioning doc
- Prospect criteria copy-paste ready for Apollo
- Personas usable by sales, marketing, and paid ads — not just SDRs
- Competitive landscape has Displaceable? ratings
- Closing line offers next steps from the standard menu
- **Markdown file `[company-slug]-icp.md` saved and surfaced (download link or file path) as the final action — skipped only if the environment cannot produce files**
