---
name: cube-account-briefing
description: "Use when a Customer Success Manager wants to scan their book of business for signals across customer conversations using Format MCP. Canonical invocation: 'using the Format MCP and the cube-account-briefing skill, apply it to these accounts over the last [N days/weeks]' followed by a list. Also triggers on 'weekly CS brief', 'scan these accounts for churn risks', 'what's been said across my accounts', 'prep me for QBR with [account]', 'book of business check', 'account health briefing', 'find risks across [accounts]'. The CSM provides a list of accounts and a time window; the skill pulls verbatim signals from calls/emails/notes via Format MCP and groups them under 6 locked CS categories (risk, blockers, adoption, relationships, growth, commercial). Surfaces evidence, does not prescribe actions."
metadata:
  display_order: 40
  overrides: format-account-briefing
  title: CS Account Briefing for Cube
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

Given a list of customer accounts and a time window, this skill scans all conversation data in Format (calls, emails, notes) tied to those accounts and produces a per-account briefing organized under 6 Customer Success signal categories. It surfaces what customers actually said, verbatim, with speaker, date, and source — it **flags signals only, it does not prescribe CSM actions**.

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

### Step 2: Orient once

`describe_org()` — one call, and it tells you what the briefing needs to be honest about: `coverage.earliestRecordAt` / `latestRecordAt` (does the requested window even overlap the data?), which sources are connected, and how many companies the workspace knows. If the requested window sits entirely outside the coverage span, say so before scanning rather than reporting six silent accounts.

If the connection can reach more than one Format workspace, `list_organizations()` names them and every response echoes the `org` that answered — check it matches the book of business you were asked about.

### Step 3: Resolve account names to Format company IDs

`list_companies` is the right tool for this — Format's companies are the customer register.

1. Call `list_companies({ nameSearch: "<account name>" })` per account — `nameSearch` is a case-insensitive substring match, so it beats paging the whole register and eyeballing it. `domainSearch` does the same on domains when you were given those instead.
2. Take the `id` off the match; that's what `companyIds` wants downstream.
3. **If an account name matches nothing**, flag it back to the user: "Couldn't find [name] in Format — skip, or did you mean [closest match]?"
4. **If a name is ambiguous** (several rows come back), ask the user to disambiguate before proceeding.

When you already hold a domain, `get_company({ domain: "acme.com" })` resolves it in one call and returns the account's mapped CRM attributes alongside — useful context for the briefing. A miss there names which key failed and points at `list_companies`.

### Step 4: Pull conversation signals per account

For each resolved company, call `search_insights` with:
- The company id in `companyIds`
- The user-specified window in `dateRange` (`{ from, to }` — a bare `YYYY-MM-DD` is accepted and becomes the right day edge)
- No topic filter — we categorize ourselves in Step 5

Each row comes back ready to cite: `text` (what the person said), `person` and `company` (each with a `source` of `linked` or `inferred` — hedge attribution on inferred ones), `record` (the conversation, with its `sourceType`), `timestamp`, and a durable `shareUrl`. Set `includeContext: true` when a signal only makes sense with the surrounding conversation — it is long, so use it when reading closely rather than on every sweep.

**An empty page explains itself.** `emptyReason` is `null` when rows came back and otherwise says why there are none: `filtered_out` (the workspace holds insights, none of them matched this filter — this account, this window, or both) or `empty_org` (there is no customer data here at all). The second one means the briefing has nothing to say about any account and should stop rather than list six silent ones; separating "quiet account" from "quiet workspace" is exactly what the silent-accounts section below turns on.

### Step 5: Categorize signals

For each insight, judge which of the 6 categories it belongs to. A single insight can belong to multiple categories (e.g. a churn-risk remark that also mentions a competitor = Risk + Growth flag). Be generous with category assignment but only include an insight if there's clear signal — do not pad.

For ambiguous insights that don't cleanly fit any category, drop them rather than force-fit. The brief is more valuable if it's tight.

**Cap per category per account: 5 insights.** If a category has more than 5 strong signals, pick the 5 most material and append a line at the bottom of that subsection: `+ N more in Format — pull the full list directly from search_insights with the same filters`.

### Step 6: Render the briefing

Output structure (markdown, in chat unless user requested file save):

```
# CS Account Briefing
**Time window:** [date range]
**Accounts scanned:** [N accounts]

## Red flags this week
[Pull only Risk & churn drivers + Commercial & viability risk signals here, sorted by account. One bullet per signal: "**[Account]** — [verbatim]" (speaker, date, source). Skip this section entirely if no red flags.]

---

## Per-account detail

### [Account name]
**Insights captured (distinct):** [N] — some appear in multiple categories below.

**Risk & churn drivers**
- "[verbatim, exactly as the insight's `text` reads]" — [speaker, role], [date], [shareUrl]
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

[Repeat per account. Skip accounts with zero signals entirely, but list them at the bottom under "Silent accounts (no activity in window) — [list]". Silent accounts are themselves a Risk signal worth surfacing. Before listing one, run one wider check for that account — `count_insights({ companyIds: [id] })` with no window is the cheapest way to ask "has this account ever said anything?", and doubling the window says when it last did: "silent for 6 weeks since announcing cancellation" and "always this quiet" are opposite findings, and the briefing should say which it is. Label any widened window clearly in that account's section — the user's window stays the default for everything else.]
```

### Step 7: Coverage caveat
At the bottom of the briefing, always include this disclaimer:

> **What this misses:** This briefing covers conversation signals only (calls, emails, notes captured in Format). For usage-decline signals — drop in active users, declining feature adoption, recommendation acceptance rate — check your product analytics. Format only sees what was said, not what was done in-product.

## Hard rules

- **Flag, do not prescribe.** Never recommend a CSM action ("you should follow up with X", "send an education email", "consider asking about Y"). Surface evidence; the CSM decides what to do. "Open threads in the data" is evidence framing — it must describe what's unresolved in the conversations, never instruct the CSM what to do about it.
- **Verbatim only — the insight's own `text`.** Do not paraphrase. Format's extraction layer has already selected the span from the underlying transcript; the skill surfaces that text and does not re-cut it from full transcripts.
- **Always cite source.** Every signal must have speaker + role + date + the insight's `shareUrl`.
- **Never fabricate signals.** If an account has no data, say so. Do not invent words or sentiment.
- **Hedge inferred attribution.** `person.source` / `company.source` is `linked` when Format knows the customer and `inferred` when the extraction only read a name out of the conversation. An inferred name is a good lead, not a confirmed speaker — say "someone at [company]" rather than asserting a person.
- **Never default the time window.** Always ask.
- **Cap at 5 insights per category per account.** If more exist, note the overflow and link back to Format — do not dump everything.

## How to prompt this skill

Use this exact pattern:

```
Using the Format MCP and the cube-account-briefing skill, apply it to these accounts over the last [N days/weeks]:

- [Account name]
- [Account name]
- [Account name]
- ...
```

Swap the time window and account list each week.

### Example 1 — canonical weekly invocation

User:
> Using the Format MCP and the cube-account-briefing skill, apply it to these accounts over the last 14 days:
>
> - [Account A]
> - [Account B]
> - [Account C]
> - [Account D]
> - [Account E]
> - [Account F]

Skill:
1. Orients with `describe_org()` — confirms the window overlaps the data Format holds
2. Resolves the account names to Format company IDs via `list_companies({ nameSearch })` (asks to disambiguate any ambiguous match, flags any name with no match)
3. Pulls insights for each resolved company from the specified window via `search_insights({ companyIds, dateRange })`
4. Categorizes each insight into the 6 buckets (multi-category assignment allowed)
5. Renders the briefing in the output structure above (red-flag rollup → per-account detail with distinct-insight count + verbatim evidence capped at 5 per category + open threads in the data → silent accounts list)
6. Appends the coverage caveat at the bottom

### Example 2 — informal trigger, skill prompts for missing inputs

User:
> How are my accounts doing this week?

Skill:
> Which accounts should I scan, and over what time window? Paste your account list and tell me the date range (e.g. last 14 days, since Apr 1).

→ Skill waits for the inputs and does not proceed until it has both an account list and a time window. It never defaults the time window or scans the whole workspace.

### Example 3 — QBR prep for a single account

User:
> Using the Format MCP and the cube-account-briefing skill, prep me for QBR with [Account] over the last 90 days.

Skill: same flow as Example 1, scoped to a single account and a 90-day window. Output structure is identical — just one account section instead of many. The five-per-category cap matters more here because a 90-day pull will surface more signal than a 14-day pull.
