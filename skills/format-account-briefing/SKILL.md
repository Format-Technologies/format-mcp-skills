---
name: format-account-briefing
description: "Use when a Customer Success Manager wants to scan their book of business for signals across customer conversations using Format MCP. Canonical invocation: 'using the Format MCP and the format-account-briefing skill, apply it to these accounts over the last [N days/weeks]' followed by a list. Also triggers on 'weekly CS brief', 'scan these accounts for churn risks', 'what's been said across my accounts', 'prep me for QBR with [account]', 'book of business check', 'account health briefing', 'find risks across [accounts]'. The CSM provides a list of accounts and a time window; the skill pulls verbatim signals from calls/emails/notes via Format MCP and groups them under 6 locked CS categories (risk, blockers, adoption, relationships, growth, commercial). Surfaces evidence, does not prescribe actions."
metadata:
  display_order: 40
  title: CS Account Briefing
  personas: [customer-success]
  image: card.jpg
  use_case: >-
    Scan your book of business for what's actually been said across customer
    conversations — risks, blockers, adoption, relationships, growth and
    commercial signals — grouped per account with verbatim evidence. Built for
    weekly briefs and QBR prep.
  limitations: >-
    You provide the account list and time window. Surfaces evidence only — it
    doesn't prescribe actions. Quality depends on how much call/email coverage
    those accounts have in Format.
  prompts:
    - "Using the CS account briefing skill, scan Acme, Globex and Initech over the last 30 days."
    - "Prep me for the QBR with Acme — what's been said across their conversations lately?"
---

# CS Account Briefing Skill

## What this skill does

Given a list of customer accounts and a time window, this skill scans all conversation data in Format (calls, emails, notes) tied to those accounts and produces a per-account briefing organized under 6 Customer Success signal categories. It surfaces verbatim quotes with speaker, date, and source — it **flags signals only, it does not prescribe CSM actions**.

## When to use it

Trigger this skill when the user asks for any of:
- A weekly CS briefing across a set of accounts
- "What's been said" across their book of business
- Prep for a QBR or 1:1 with a specific customer
- A churn-risk scan across named accounts
- An account health check on named accounts

Do NOT trigger this skill for scans across the entire Format workspace without a named account list — this skill is account-scoped only.

## Required inputs

1. **Account list** — names of the customer companies the CSM wants to scan
2. **Time window** — the date range to pull signals from (e.g. "last 14 days", "since April 1")

If either input is missing, **prompt the user for it before proceeding.** Do not guess or default. Sample prompt:

> "Which accounts should I scan, and over what time window? Paste your account list and tell me the date range (e.g. last 14 days, since Apr 1)."

## Optional inputs

- **Extra topics** — the CSM may add ad-hoc themes beyond the 6 categories (e.g. "also flag anything about the new pricing change")
- **Output destination** — chat (default), or save to a file in the working directory

## The 6 signal categories

Every per-account section organizes evidence under these six buckets, in this order. Each category has a definition below. If you want concrete example phrases to calibrate what each category looks like in conversation data, see `references/example-phrases.md`.

### 1. Risk & churn drivers
Signals the account may shrink or leave: sponsor turnover with no replacement engaged, exec disengagement, "going dark," renewal hedging, evaluating alternatives, silent risk (no activity at all in the window), or explicit non-renewal cues. **Competitor mentions in a replacement context belong here.**

### 2. Product & process blockers
Issues in product or workflows blocking value: recurring bugs, integration failures, UI friction, regulatory or compliance anxiety, missing capabilities, or support tickets stalling core use cases.

### 3. Adoption & enablement gaps
Evidence customers haven't reached or sustained key milestones: slow or incomplete onboarding, shallow use of core features, repeated "how do I…?" questions, persona-specific confusion (different user types within the same account have different software fluency and different blockers), training requests.

### 4. Relationship & stakeholder health
Human signals about relationship strength: multithreading vs single-threaded, new or lost champions, detractors, exec engagement in reviews, changes in who shows up or responds.

### 5. Growth & expansion signals
Buying intent and growth triggers: interest in new modules/seats/locations, mention of new initiatives, hiring, funding, new use cases. **Competitor mentions in an additive context belong here** (e.g. "we also use X for Y" = upsell opportunity).

### 6. Commercial & viability risk
Signals the business or contract may not sustain: payment delays, downgrade conversations, cost-cut language, talk of closing/selling the business, contract/billing transparency complaints.

## Process

### Step 1: Confirm inputs
If account list or time window is missing, prompt for them. Do not proceed without both.

### Step 2: Resolve account names to Format company IDs

Use the Format MCP to map each account name to its company record. Default to `list_companies` — that's the right call for Format's data model. Only fall back to `list_organizations` or `list_records` if `list_companies` returns nothing.

1. Call `list_companies` with a reasonable page size
2. Fuzzy-match each provided name to a returned company name
3. **If an account name doesn't match anything in Format**, flag it back to the user: "Couldn't find [name] in Format — skip, or did you mean [closest match]?"
4. **If a name is ambiguous** (multiple matches), ask the user to disambiguate before proceeding

### Step 3: Pull conversation signals per account

For each resolved company, call `search_insights` with:
- The company ID as a filter (`companyIds` parameter)
- The user-specified date range
- `isAiRejected: false` (excludes insights Format's review layer flagged as low-confidence — keeps the brief tight)
- No topic filter — we categorize ourselves in Step 4

Then for each returned insight, capture: verbatim quote, speaker name + role, date, source type (call / email / note), and the `shareUrl` (Format link to the underlying record).

### Step 4: Categorize signals

For each insight, judge which of the 6 categories it belongs to. A single insight can belong to multiple categories (e.g. a churn-risk quote that also mentions a competitor = Risk + Growth flag). Be generous with category assignment but only include an insight if there's clear signal — do not pad.

For ambiguous insights that don't cleanly fit any category, drop them rather than force-fit. The brief is more valuable if it's tight.

**Cap per category per account: 5 quotes.** If a category has more than 5 strong signals, pick the 5 most material and append a line at the bottom of that subsection: `+ N more in Format — pull the full list directly from search_insights with the same filters`.

### Step 5: Render the briefing

Output structure (markdown, in chat unless user requested file save):

```
# CS Account Briefing
**Time window:** [date range]
**Accounts scanned:** [N accounts]

## Red flags this week
[Pull only Risk & churn drivers + Commercial & viability risk signals here, sorted by account. One bullet per signal: "**[Account]** — [verbatim quote]" (speaker, date, source). Skip this section entirely if no red flags.]

---

## Per-account detail

### [Account name]
**Insights captured (distinct):** [N] — some appear in multiple categories below.

**Risk & churn drivers**
- "[verbatim quote]" — [speaker, role], [date], [source link]
- ...

**Product & process blockers**
- ...

**Adoption & enablement gaps**
- ...

**Relationship & stakeholder health**
- ...

**Growth & expansion signals**
- ...

**Commercial & viability risk**
- ...

**Open threads in the data**
- [Surface unresolved items from the conversations themselves — e.g. "Customer asked about [X] on [date]; no follow-up captured in subsequent records." Frame each bullet as evidence of an unresolved item, not as a question to ask or an action to take.]
- [Only include items grounded in the data. Do not prescribe CSM actions. Do not invent forward-looking strategy. Do not write "you should ask…" or "consider raising…"]

[Omit any category subsection that has zero signals — do not print empty buckets. Omit "Open threads in the data" entirely if there are no unresolved items.]

---

[Repeat per account. Skip accounts with zero signals entirely, but list them at the bottom under "Silent accounts (no activity in window) — [list]". Silent accounts are themselves a Risk signal worth surfacing. Before listing one, run one wider check (double the window) for that account: "silent for 6 weeks since announcing cancellation" and "always this quiet" are opposite findings, and the briefing should say which it is. Label any widened window clearly in that account's section — the user's window stays the default for everything else.]
```

### Step 6: Coverage caveat
At the bottom of the briefing, always include this disclaimer:

> **What this misses:** This briefing covers conversation signals only (calls, emails, notes captured in Format). For usage-decline signals — drop in active users, declining feature adoption, recommendation acceptance rate — check your product analytics. Format only sees what was said, not what was done in-product.

## Hard rules

- **Flag, do not prescribe.** Never recommend a CSM action ("you should follow up with X", "send an education email", "consider asking about Y"). Surface evidence; the CSM decides what to do. "Open threads in the data" is evidence framing — it must describe what's unresolved in the conversations, never instruct the CSM what to do about it.
- **Verbatim quotes only — from the Format insight.** Do not paraphrase. Format's extraction layer has already selected the quote span from the underlying transcript; the skill surfaces those insight-level quotes and does not re-quote from full transcripts.
- **Always cite source.** Every signal must have speaker + role + date + Format link.
- **Never fabricate signals.** If an account has no data, say so. Do not invent quotes or sentiment.
- **Never default the time window.** Always ask.
- **Cap quotes at 5 per category per account.** If more exist, note the overflow and link back to Format — do not dump everything.

## How to prompt this skill

Use this exact pattern:

```
Using the Format MCP and the format-account-briefing skill, apply it to these accounts over the last [N days/weeks]:

- [Account name]
- [Account name]
- [Account name]
- ...
```

Swap the time window and account list each week.

### Example 1 — canonical weekly invocation

User:
> Using the Format MCP and the format-account-briefing skill, apply it to these accounts over the last 14 days:
>
> - [Account A]
> - [Account B]
> - [Account C]
> - [Account D]
> - [Account E]
> - [Account F]

Skill:
1. Resolves the account names to Format company IDs via `list_companies` (asks to disambiguate any ambiguous match, flags any name with no match)
2. Pulls insights for each resolved company from the specified window via `search_insights` with `isAiRejected: false`
3. Categorizes each insight into the 6 buckets (multi-category assignment allowed)
4. Renders the briefing in the output structure above (red-flag rollup → per-account detail with distinct-insight count + verbatim quotes capped at 5 per category + open threads in the data → silent accounts list)
5. Appends the coverage caveat at the bottom

### Example 2 — informal trigger, skill prompts for missing inputs

User:
> How are my accounts doing this week?

Skill:
> Which accounts should I scan, and over what time window? Paste your account list and tell me the date range (e.g. last 14 days, since Apr 1).

→ Skill waits for the inputs and does not proceed until it has both an account list and a time window. It never defaults the time window or scans the whole workspace.

### Example 3 — QBR prep for a single account

User:
> Using the Format MCP and the format-account-briefing skill, prep me for QBR with [Account] over the last 90 days.

Skill: same flow as Example 1, scoped to a single account and a 90-day window. Output structure is identical — just one account section instead of many. The 5-quotes-per-category cap matters more here because a 90-day pull will surface more signal than a 14-day pull.
