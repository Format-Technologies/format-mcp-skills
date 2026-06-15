---
name: format-ads-copy
description: Use when drafting, iterating, or refreshing paid ad copy for LinkedIn Ads, Google Ads, or LinkedIn Lead Gen Forms — grounded in real customer language from Format. Trigger phrases include "write LinkedIn ads", "Google ad copy", "RSA headlines", "Lead Gen Form copy", "paid ad variations", "refresh our LinkedIn ads", "new ad angles", "ad creative from customer quotes", "ads that sound like our customers", "iterate on these ads", or "performance is dropping, give me new ads". This skill uses the Format MCP to source in-market language, pain points, and outcome language directly from customer conversations — then produces spec-compliant ad copy for LinkedIn Single Image Ads, Google RSAs, and LinkedIn Lead Gen Forms. Runs end-to-end in one response. Not for campaign strategy, targeting, budgets, landing pages, or ad visuals — those are separate jobs.
metadata:
  display_order: 70
  title: Paid Ads Copy
  personas: [marketing]
  image: card.jpg
  related: [format-company-context]
  use_case: >-
    Ship ad copy that sounds like your customers because it is built from
    them: 3–5 angles each anchored to a verbatim quote, spec-compliant copy
    for LinkedIn, Google RSA, and Lead Gen Forms, with character counts
    validated and CSV blocks ready to upload.
  limitations: >-
    Copy only — no visuals, targeting, budgets, or landing pages. Needs
    roughly 30+ relevant conversations in Format for real language signal.
    Customer names never appear in creative without sign-off.
  prompts:
    - "Write LinkedIn ads, Google RSAs and Lead Gen Form copy that sounds like our customers."
    - "Our ad performance is dropping — give me new angles from real customer language."
---

# Paid Ads Copy

## Execution principle

This skill runs silently and completes in a single response. When invoked, Claude's immediate next action is a tool call — not a chat message. No opening statement, no progress narration, no interim findings, no mid-run bailouts, no "want me to continue?" prompts. The user sees tool calls rendered by the UI; Claude's next chat output is the finished deliverable.

If the full analysis can't fit in one turn, narrow the scope silently — but always complete a usable deliverable in one response. Never dump partial findings as an interim summary and ask to continue.

The document is the deliverable. Everything else is noise.

---

## What this skill produces

A single document with, for each requested channel:

- **3–5 angles** — each grounded in a verbatim customer quote (speaker, company, source, date, link) so the user can defend the angle in a brief
- **Spec-compliant ad copy** for every variant — character counts shown next to every field, anything over limit trimmed in the same response
- **A CSV block** per channel for direct upload
- **An iteration log** when performance data was provided

Default scope: all three channels (LinkedIn Single Image, Google RSA, LinkedIn Lead Gen Form). If the user asks for one, generate only that one.

Delivered inline in chat, and as a markdown file where the environment can save one (a presented download on claude.ai, a file in the working directory in Claude Code or Cursor). Inline only is fine when it can't.

## When to use

- Launching a new paid campaign and starting from scratch
- Refreshing fatigued creative (CTR dropping, frequency climbing)
- Testing new angles, or building ads for a new persona, vertical, or use case
- Briefing an agency with grounded starting creative

## When NOT to use

- Campaign strategy, channel selection, targeting, budgets, bidding — out of scope; if a strategy skill is available in your library suggest it, otherwise state your assumptions inline and carry on
- Landing page copy, CRO, ad visuals, organic posts — separate jobs
- Fewer than ~30 relevant conversations in Format — not enough language signal

## Setup

If Format MCP isn't connected yet: Settings → Connectors → Add custom connector → `https://useformat.ai/api/mcp` → authenticate with your Format account.

---

## The run

Aim for about 8 tool calls — a budget, not a law; it keeps the run fast, and the angle work is in the writing, not the pulling. If the workspace forces more (pagination, thin topics), spend what the deliverable needs and no more.

### Step 0: Check for shared company context (0 calls)

If a Format company-context document (the output of the `format-company-context` skill) is already in the conversation or working directory, read it and use its personas, pain points, brand voice, and words-to-use/avoid to shape angles and tone. Still pull fresh customer language from Format for the verbatim anchor quotes — the context doc frames, Format grounds. Note it silently in the header block: `Company context loaded (last refreshed [date]).` Its absence blocks nothing — proceed with the full pulls below; no prompt, no offer to run the other skill first.

When reusing a quote from the context doc, keep attribution intact (speaker, company, source, date, link). Never launder quotes into synthesized claims.

### Step 1: Orient (2 calls)

```
list_organizations()   → confirm the org
list_topics()          → what this workspace listens for
```

Topic names vary across Format orgs. Map the available topics to the roles below silently and proceed.

| Analytical role | Candidate topic names (pick closest available) |
|---|---|
| Pain points | Negative Product Feedback, Churn Risk Signals, Buying Objections, Feature Requests |
| Outcomes / value | Positive Feedback, Customer Love |
| Competitive / displacement | Competitive Intelligence, Competitors and Alternative Solutions |
| Pre-purchase language | Inbound Drivers, Go-to-market Signals, Buying Objections |

### Step 2: Pull the language (4–5 calls)

Pull verbatim customer language per angle category. Use `level: 0` explicitly — angles anchor to individual quotes, not synthesized themes — and `select: "default"` (it carries the quote, attribution, and share link).

```
search_insights({ topicNames: ["<pain topic>"],        level: 0, select: "default", limit: 40 })
search_insights({ topicNames: ["<outcome topic>"],     level: 0, select: "default", limit: 40 })
search_insights({ topicNames: ["<competitive topic>"], level: 0, select: "default", limit: 30 })
search_insights({ semanticQuery: "<core pain in customer words>", level: 0, limit: 20 })
```

Skip any topic that doesn't exist or runs thin — better 3 strong categories than padding with weak ones. **Always include at least one `semanticQuery` pass:** topics are a lens, not the corpus, and the workspace's untopiced insights often hold the freshest in-market phrasing. If the user named a persona, vertical, or product line, add one filtered pull for it.

### Step 3: Note the data window

From the pulled insights' timestamps, note the span actually read (earliest → latest). It goes in the header block — readers of ad copy six weeks from now need to know which era of customer voice it reflects.

---

## How to turn Format data into ad angles

For each angle, you need **one verbatim quote** as the anchor. The angle line is the pain/outcome compressed into a headline-grade statement — not the quote itself. Quotes stay as proof; copy stays as copy.

**Target: 3–5 angles total across all channels.** The same angle adapts to each channel's specs.

- **Cluster quotes by theme.** Five quotes saying the same thing = one strong angle, not five weak ones.
- **Prefer specificity** — numbers, tool names, time spans, role-specific workflows. "We used to pull reports every Monday for 3 hours" is signal; "it's great, saves us time" is noise.
- **Cover distinct motivations.** Mix pain, outcome, competitive displacement, status-quo callout, identity — don't ship five pain angles.

| Category | When it works |
|---|---|
| Pain point | Target is problem-aware and frustrated |
| Outcome / transformation | Target knows solutions exist, wants proof |
| Competitive displacement | Target currently uses a named competitor |
| Status quo callout | Target is DIYing it or living in spreadsheets |
| Identity / role | Target self-identifies with a specific job pattern |
| Social proof / volume | You have customer density worth citing |

## Platform specs (validate every piece of copy)

### LinkedIn Single Image Ad

| Field | Recommended | Hard max |
|---|---|---|
| Introductory text | 150 chars | 600 chars |
| Headline | 70 chars | 200 chars |
| Description | 100 chars | 300 chars |

Front-load the hook in the first 150 intro chars (feed truncates with "…see more"). The description only shows on some placements — treat as optional reinforcement.

### Google Ads — Responsive Search Ad

| Field | Limit | Quantity |
|---|---|---|
| Headline | 30 chars | up to 15 (min 3) |
| Description | 90 chars | up to 4 (min 2) |

Every headline must stand alone AND combine sensibly with any other. Include at least one keyword headline, one benefit headline, one CTA headline. Tag each with its intent for the user's reference (`[KW]` `[BEN]` `[CTA]` `[PROOF]` — tags are not uploaded). Avoid all-caps, stacked punctuation, unsupported superlatives (policy risk). Default to one consolidated RSA spanning all angles (RSAs perform better with more variants).

### LinkedIn Lead Gen Form

Two layers: the **ad driving to the form** (Single Image specs above, CTA matched to the offer — Download / Register / Get quote, not Learn more) and the **form**:

| Form field | Limit |
|---|---|
| Offer headline | 60 chars |
| Offer detail | 160 chars |
| CTA button | LinkedIn preset list |
| Confirmation headline | 60 chars |
| Confirmation message | 300 chars |
| Confirmation CTA | preset list |
| Privacy policy URL | required — flag as `[verify URL]` if not derivable |

The offer must be tangible (guide, template, demo, audit, report). Max 3 custom questions — every extra field drops completion.

## Output structure

```
# Paid Ad Creative — [Company]
[Stage-setting opener, 2–3 sentences: built from N customer conversations
spanning [earliest]–[latest], across [the categories pulled]; M angles,
channels covered. Company context loaded (last refreshed [date]) — if it was.]

## The angles
| # | Angle | Category | Anchor quote | Source |
[3–5 rows. Anchor quote verbatim, trimmed to the punch with an ellipsis —
never reworded. Source: speaker, company, channel, date, link.]

## LinkedIn Single Image
[Per angle: intro / headline / description, each with (N chars). Then the CSV block.]

## Google RSA
[10–15 tagged headlines + 3–4 descriptions, each with (N). Then the CSV block.]

## LinkedIn Lead Gen Forms
[Per angle: the driving ad + the form fields, each with (N). Then the CSV block.]

## Validation
[One line per channel: field count, all within limits. Anything trimmed, flagged here.]

## Read this with
[The caveats, once: the data window; that proof numbers are
customer-reported (linked), not measured benchmarks; any thin category
skipped; the privacy-URL placeholder if used.]
```

### Iteration mode

If the user provides performance data (CSV, pasted table, or "headline X got 2.3%, Y got 0.8%"), open the deliverable with an **Iteration log**: top and bottom performers, the winning and losing patterns named specifically ("numbers in first 5 words", "named competitor"), and this round's decisions — double down, extend, retire, new test. Then generate fresh copy reflecting those decisions; never regenerate identical copy.

## Writing quality standards

- **Specific over vague.** "Cut reporting time 75%" beats "Save time."
- **Customer language over marketing language.** If five quotes say "pulling reports every Monday for 3 hours", the headline is closer to "Stop pulling Monday reports" than "Streamline your reporting workflow."
- **Numbers only when real.** A verbatim "we saved 10 hours a week" supports "save 10 hours a week". No quote, no number.
- **Descriptions complement, never repeat** — proof points, objection handling ("No credit card required"), reinforced CTAs, the specificity the headline couldn't fit.
- Avoid: jargon the customer data doesn't use, adjective stacks, "#1/leading/most powerful", clickbait the landing page can't honor, emojis carrying meaning, framework names (PAS, AIDA) in the output.

## Principles

These are the defaults that make the copy defensible. They're guidance, not law — depart when the situation genuinely calls for it, and say so when you do. The two exceptions that stay firm: quotes are never fabricated, and nothing in Format is modified or deleted.

- **Every angle traces to a verbatim quote** — speaker, company, source, date, link. Trim with an ellipsis; never substitute words. The quote anchors the angle; the copy is inspired by its pattern, not a lift.
- **No invented pain points.** If the data doesn't show it, the angle doesn't ship — and generic "save time, save money" angles don't ship either.
- **Customer names stay out of creative without sign-off.** Quotes with attribution live in the internal angle table; ad copy that names a customer or implies their endorsement needs their approval first — flag it, don't ship it.
- **Every field validates before shipping.** Character counts shown, overages trimmed in the same response.
- **The data window is visible.** The header says what period of customer voice this copy reflects.

## Close

After the deliverable, one sentence offering 2–3 next steps (adapt to another channel, landing-page copy to match an angle, a 4-week test plan). One sentence. No methodology notes.
