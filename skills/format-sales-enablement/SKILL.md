---
name: format-sales-enablement
description: "Use when a sales team wants collateral built from what their customers and prospects have actually said — pitch decks, one-pagers, objection-handling docs, demo scripts, talk tracks, battlecards, buyer-persona cards, or deal-specific value framing. Trigger phrases include 'sales deck', 'pitch deck', 'one-pager', 'leave-behind', 'objection handling', 'demo script', 'talk track', 'sales playbook', 'buyer persona card', 'battlecard', 'help my sales team', 'sales collateral', or 'what should I give my reps'. The skill asks which asset you want (if you haven't said), then uses the Format MCP to ground it in verbatim customer language, real objections and the responses that worked, and quote-backed proof points. Not for marketing website copy, cold email, or paid ads — those are different jobs."
metadata:
  display_order: 80
  title: Sales Enablement
  personas: [sales]
  image: card.jpg
  related: [format-company-context]
  use_case: >-
    Sales collateral reps actually trust because it's built from your own
    deals: pick the asset — deck, one-pager, objection doc, demo script,
    battlecard, persona card, or ROI framing — and get it grounded in
    verbatim customer language and the objections and proof points your
    conversations actually contain.
  limitations: >-
    Grounded in conversation data — claims it can't support from customer
    language are flagged for you to fill, not invented. Pricing and customer
    financials heard on calls are internal evidence, never published figures.
    Not for website copy, cold email, or paid ads.
  prompts:
    - "Help my sales team — what collateral can you build from our conversations?"
    - "Build an objection-handling doc from what prospects actually say."
    - "Draft a one-pager and a demo script grounded in our customer calls."
---

# Sales Enablement

## What this skill does

Reps use what reps trust, and they trust collateral that sounds like their actual deals — not marketing's idealized version. This skill builds sales assets grounded in what customers and prospects have really said in the Format workspace: the objections that actually come up and the responses that actually landed, the value customers actually name, the language they actually use.

It produces one asset at a time, well, from a menu:

| Asset | What it is |
|---|---|
| **Objection-handling doc** | Every objection ranked by how many accounts raised it, with the field-observed response and proof |
| **Pitch / sales deck** | 10–12 slide narrative arc (problem → shift → approach → proof → next step) |
| **One-pager / leave-behind** | Single-page recap: problem, solution, 3 differentiators, proof, CTA |
| **Demo script / talk track** | Opening → discovery recap → solution walkthrough mapped to their pains → close |
| **Battlecard** | Per named competitor: how customers compare you, where you win/lose, the reframe |
| **Buyer-persona card** | One archetype: what they care about, the pains in their words, where to find them |
| **Deal-specific value framing** | The value story for one named account, from what that account has said |

## The entrypoint — ask which asset, once

**If the user named the asset(s)** ("build an objection doc", "I need a one-pager for the trade show"), skip straight to building — confirm only a genuinely ambiguous scope (which persona? which competitor? which account?).

**If the request is generic** ("help my sales team", "what should I give my reps", "sales collateral"), make one checkpoint: show the menu above, ask which asset(s) they want and for which persona / deal stage / competitor where that matters, and — if you can see it from a quick `describe_org` — name what the workspace can ground well ("your conversations are rich on objections and competitive mentions; lighter on ROI numbers"). Take their pick, then build without further questions.

This is the only planned stop. Use the environment's question UI where one exists (e.g. plan-mode option pickers); otherwise ask in prose. One asset per run is the default — if they want several, confirm the set at the checkpoint and produce them in sequence in one deliverable.

## Before building — gather grounding (don't interview the user)

**Check for company context first.** If a Format company-context document (the `format-company-context` skill's output) is in the conversation or working directory, read it and treat it as the answers to value-prop, ICP, persona, and positioning questions — do **not** interview the user for those. Its absence blocks nothing; you'll pull what you need from Format directly.

Then pull what the chosen asset needs (each asset's section below says which). Across all of them:

- `describe_org()` → one call for the org that answered, this workspace's `topics` (names vary; never assume one exists), the CRM `attributes` you can filter on, the `coverage` date span, and `processing.hasGroups`. Use `list_organizations()` only when the connection can reach more than one workspace.
- **Two verbs, and the one you call is the altitude.** `search_insight_groups` returns themes across customers — each with a `title`, a `subtitle`, `customerCount` (distinct customers), `mentions`, and a `lifecycleState`; that is what ranks an objection or a differentiator. `search_insights` returns what one person said, once, in their own words — the evidence under it. Drill from a theme to its evidence with `search_insights({ supportingGroupId: "<group id>" })`. Where `hasGroups` is false, nothing has been grouped here yet — work from `search_insights` alone and cluster as you go; `emptyReason: "no_groups_yet"` is the same news arriving from the other direction.
- **Rank with `customerCount`; never sum it.** Themes nest, so a customer in a narrow theme is counted again in every broader one — the column orders a doc, it doesn't total. And group `id`s are handles for this conversation only: never write one into an asset.
- **Always pair topic pulls with at least one unscoped `semanticQuery` sweep.** Every insight sits under exactly one topic, so filtering to the two or three you judged relevant drops everything that landed under a topic you didn't pick — and the language you didn't predict is exactly what you came for.
- Note the **data window** (earliest → latest `timestamp` actually read); every asset states it.

## Building each asset

### Objection-handling doc
Census-first, the strongest-grounded asset. `search_insight_groups({ topicNames: ["<objections topic>"] })` gives the objections as themes; rank them by `customerCount` — how many distinct accounts raised each — and that ranking decides both the order and what makes the doc. Then `search_insights({ supportingGroupId })` for the words. Per objection: the as-heard line (attributed) → why they say it (the real concern) → the response, tagged **field-observed** (a rep ran it on a real call, cite it, with the outcome where the data shows one) or **suggested — not yet field-tested** (no observed resolution; a reasonable play, clearly labelled). Plus a proof point and a follow-up question. Lead with a one-screen quick-reference table; close with a "when to walk" section. Unresolved recurring objections are listed and marked, not hidden.

### Pitch / sales deck
10–12 slides, story arc not feature tour: current-world problem (in customer language) → cost of the problem → the shift creating urgency → your approach → 3–4 key workflows → proof points → one customer story → value/ROI → next step. One idea per slide. Pull pain, positive-outcome, and competitive topics; every problem and proof slide carries a verbatim quote behind it. Flag pricing and hard ROI numbers as founder-input gaps rather than inventing them.

### One-pager / leave-behind
Problem (one sentence, their words) → solution → 3 differentiators customers actually name → one strong proof point (metric or quote) → CTA. Scannable in 30 seconds. Sourced from positive-feedback and differentiation language.

### Demo script / talk track
Opening → discovery recap → solution walkthrough built around the 3–4 pains customers most raise (pulled from the pain/feature-request topics) → interaction points → close with next step. The script maps features to *their* stated pains, not a feature tour.

### Battlecard
For the named competitor (or the most-mentioned one from the competitive topic): how customers describe choosing between you, where they say you win, where they say you lose (kept honest — losses are the useful part), and the reframe reps can use, each backed by a verbatim competitive-mention insight.

### Buyer-persona card
One archetype from `list_persons` + the conversations: role, what they care about, the pains in their own words, objections they raise, where to reach them. Every line backed by an insight; roles taken from titles or mapped CRM `attributes` where present, never invented.

### Deal-specific value framing
For one named account: pull that account's conversations (`companyIds`), assemble the value story from what *they* said — their stated goals, the pains they named, the outcomes they've already praised — so the rep walks in with the customer's own words.

## Output

Delivered inline, and as a markdown file where the environment can save one. Every asset opens with a stage-setting line: what it is, who/what it's for, and the data window it's built from.

```
# [Asset] — [Company] (+ persona / competitor / account where relevant)
[One- or two-sentence opener: what this is, built from N conversations
spanning [window], for [persona/stage/competitor].]

[The asset, in its structure above.]

## Read this with
[Caveats, once: the data window; which claims are founder-input gaps vs
quote-backed; for objection docs, how many responses are field-observed vs
suggested; that pricing/financials quoted from calls are internal evidence,
never published figures.]
```

## Principles

These are the defaults that make the collateral trustworthy. They're guidance, not law — depart when the situation genuinely calls for it, and say so when you do. The two exceptions that stay firm: quotes are never fabricated, and nothing in Format is modified or deleted.

- **Reps trust what's real.** Every problem, differentiator, objection, and proof point traces to a verbatim customer insight — speaker, company, date, `shareUrl`. Paraphrase belongs outside quotation marks. Where `person.source` or `company.source` reads `inferred`, the name came out of the conversation rather than a linked customer record — hedge it.
- **Grounding over guessing.** What the conversations can't support (pricing mechanics, hard ROI numbers, strategic positioning) is flagged as a founder-input gap, never filled with generic B2B copy.
- **Field-observed beats invented** (objection docs especially): a response a rep actually ran, cited to the call, is the product; suggestions are tagged as suggestions.
- **Customer financials stay internal.** Pricing, revenue, or contract figures heard on calls are context, never published collateral copy.
- **The data window is visible.** Every asset states the period of customer voice it reflects.
- **One asset, done well.** The checkpoint settles scope; after it, the next chat output is the deliverable.

## Close

After the deliverable, one sentence offering 2–3 adjacent assets from the menu (e.g. "want the matching objection doc, or a battlecard for the competitor that came up most?"). One sentence. No methodology notes.
