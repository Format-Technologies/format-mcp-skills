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

### Step 1: Orient (1 call)

```
describe_org()   → the whole picture in one call
```

It returns the org that answered, this workspace's `topics` (name, the standing question each one asks, how many insights sit under it), the CRM `attributes` you can filter on, the connected `sources`, the `coverage` date span, and `processing` — whether Format has gathered anything into insight groups yet.

Topic names vary across Format orgs. Map the available topics to the roles below silently and proceed. `topicNames` matches these names case-insensitively; a name that isn't there is refused with the valid list rather than silently returning nothing, so guessing is cheap to correct but never worth doing twice.

| Analytical role | Candidate topic names (pick closest available) |
|---|---|
| Pain points | Negative Product Feedback, Churn Risk Signals, Buying Objections, Feature Requests |
| Outcomes / value | Positive Feedback, Customer Love |
| Competitive / displacement | Competitive Intelligence, Competitors and Alternative Solutions |
| Pre-purchase language | Inbound Drivers, Go-to-market Signals, Buying Objections |

### Step 2: Pull the language (4–5 calls)

`search_insights` is the tool for this: it returns what one person said, once, in their own words — which is exactly what an anchor has to be. (Its sibling `search_insight_groups` returns themes across customers; that's Step 2b, for deciding *which* angles are worth writing.) Each row carries the `text`, who said it, which company they're from, the conversation it came from, when, and a durable `shareUrl` — everything the angle table needs, with no options to set.

```
search_insights({ topicNames: ["<pain topic>"],        limit: 40 })
search_insights({ topicNames: ["<outcome topic>"],     limit: 40 })
search_insights({ topicNames: ["<competitive topic>"], limit: 30 })
search_insights({ semanticQuery: "<core pain in customer words>", limit: 20 })
```

Skip any topic that doesn't exist or runs thin — better 3 strong categories than padding with weak ones. **Always include at least one unscoped `semanticQuery` pass:** every insight sits under exactly one topic, so a topic-scoped pull only ever shows you the topics you thought to name — and the freshest in-market phrasing is usually filed somewhere you didn't guess. If the user named a persona, vertical, or product line, add one filtered pull for it (`companyIds`, `personIds`, or `attributeFilters` using the labels and operators `describe_org` listed).

### Step 2b: Let Format's own clustering pick the angles (1 call, when it can)

Clustering what customers said into themes is the work of angle-finding — and where the workspace has been through Format's analysis, it is already done. `search_insight_groups({ limit: 20 })` returns the themes running across this org's customers, each with a `title`, a one-line `subtitle`, and a `customerCount` — how many distinct customers contributed. Rank angles by that number; it is the right basis for "biggest".

**Rank with `customerCount`, never sum it.** Groups nest, and a customer counted in a narrow theme is counted again in every broader theme above it — adding the numbers across rows double-counts people.

Then take the anchor straight from the theme: `search_insights({ supportingGroupId: "<group id>", limit: 10 })` returns every insight gathered under it, and the strongest one is your anchor. Note the group `id`s are handles for this conversation only — Format re-clusters, so never write one into the deliverable or a saved file.

If `search_insight_groups` comes back empty, `emptyReason` says why: `no_groups_yet` means this workspace hasn't been through the analysis (skip this step, cluster the insights yourself — the run is otherwise identical), `filtered_out` means loosen the filter, `empty_org` means there is no customer data to write from at all.

### Step 3: Note the data window

From the pulled insights' timestamps, note the span actually read (earliest → latest). It goes in the header block — readers of ad copy six weeks from now need to know which era of customer voice it reflects.

---

## How to turn Format data into ad angles

For each angle, you need **one verbatim insight** as the anchor. The angle line is the pain/outcome compressed into a headline-grade statement — not the customer's words themselves. Their words stay as proof; copy stays as copy.

**Target: 3–5 angles total across all channels.** The same angle adapts to each channel's specs.

- **Cluster by theme.** Five insights saying the same thing = one strong angle, not five weak ones. Where Step 2b found insight groups, that clustering is already done for you.
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
| # | Angle | Category | Anchor insight | Source |
[3–5 rows. The anchor verbatim, trimmed to the punch with an ellipsis —
never reworded. Source: speaker, company, channel, date, shareUrl.]

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

- **Every angle traces to one verbatim insight** — speaker, company, source, date, `shareUrl`. Trim with an ellipsis; never substitute words. The insight anchors the angle; the copy is inspired by its pattern, not a lift.
- **No invented pain points.** If the data doesn't show it, the angle doesn't ship — and generic "save time, save money" angles don't ship either.
- **Customer names stay out of creative without sign-off.** Quotes with attribution live in the internal angle table; ad copy that names a customer or implies their endorsement needs their approval first — flag it, don't ship it.
- **Every field validates before shipping.** Character counts shown, overages trimmed in the same response.
- **The data window is visible.** The header says what period of customer voice this copy reflects.

## Close

After the deliverable, one sentence offering 2–3 next steps (adapt to another channel, landing-page copy to match an angle, a 4-week test plan). One sentence. No methodology notes.
