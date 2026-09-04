---
name: edgetier-triage-enrichment
description: Enrich Linear triage tickets with customer evidence from Format before the Monday product meeting. Use this whenever the user asks to run the triage enrichment, enrich triage, enrich a ticket, prep triage for the Monday meeting, add customer evidence to Linear, check what customers have said about a feature request, or pastes a Linear ticket URL and wants evidence pulled in. Trigger even if they don't say "skill" — phrases like "run the Monday prep", "pull evidence for this ticket", or "what have customers said about the tickets in triage" all mean this skill. Requires the Linear and Format connectors.
metadata:
  title: Triage Enrichment for EdgeTier
  personas: [product, customer-success]
  image: card.jpg
  use_case: >-
    Before the Monday product meeting, pull every Linear triage ticket and
    attach verifiable customer evidence from Format: verbatim quotes, who
    said them and when, a count of companies and people asking, and a link
    to every insight. You approve each ticket before anything is written.
  limitations: >-
    Only exact-match evidence is written to a ticket; related-but-different
    asks are surfaced in chat for you to judge. Never estimates effort or
    complexity. Needs the Linear and Format connectors, and only attaches
    customers that already exist in your Linear Customers list.
  prompts:
    - "Run the triage enrichment for Monday."
    - "Pull customer evidence for this ticket: [paste Linear URL]"
    - "What have customers said about the tickets in triage over the last 6 months?"
---

# EdgeTier Triage Enrichment

Enrich Linear triage tickets with verifiable customer evidence from Format so the Monday product meeting decides on data, not memory. The skill proposes; the user approves. Nothing is ever written to Linear without an explicit yes.

## Why the guardrails matter

The product team trusts this process only if every quote is real and every match is genuinely the same request. One paraphrased quote or one loosely-related insight added to a ticket destroys that trust permanently. When in doubt at any step: show the user and ask, don't write.

## Preconditions

Check that both the **Linear** and **Format** connectors are available. If either is missing, name the missing one, tell the user to enable it in Connectors, and stop.

## Scope

- User pasted a Linear ticket URL → run on that ticket only.
- Otherwise → run on every issue in **Triage** status in the **Customer Success** team in Linear.

Default evidence window: **last 90 days**. The user can override ("check the last 6 months").

---

## Step 1 — Fetch

Pull the triage tickets from Linear. State the count and list the titles so the user sees the scope before any searching starts. If zero tickets: say so and stop.

Then tell the user what happens next, in one short message:

> Found 6 tickets in Triage:
> 1. Acme - Surveys - missing surveys for chats
> 2. ...
>
> Searching Format for customer evidence (last 90 days). Takes a few minutes — I'll come back with a draft for each ticket. Nothing gets written to Linear without your OK.

If the run includes tickets the user did not raise, ask upfront whether to enrich those too. Descriptions read as the owner's words; don't put evidence on a colleague's ticket without the user deciding that's fine.

## Step 2 — Parse each ticket

For each ticket, establish:

- **The requesting customer.** Take it from the ticket's attached Customers object first. If nothing is attached, fall back to the title. If still ambiguous, ask the user — never guess.
- **The request itself.** Read it from the description only. The title is a hint, never the source. Titles often follow "Client - Feature - Request" but not always — some lead with a feature or integration name instead. Never skip or flag a ticket because the title looks unusual.
- **Already-attached customers** (the Customers object) and **who raised the ticket**.

Search terms in Step 4 come from the description content, not title keywords.

## Step 3 — Match customers to Format

Resolve each Linear customer name to a Format company (search by name or domain). If there is no clean single match, show the closest candidates and ask the user to pick. Never silently choose — a wrong company match poisons every downstream search.

Batch all Step 2 and Step 3 questions into **one message before searching**, so the user is asked once, not interrupted repeatedly:

> Two things before I search:
> - CS-101 has no customer attached and the title doesn't name one. Who's the requester?
> - CS-102 says "Globex" but Format has "Globex Software" and "Globex GmbH". Which one?

## Step 4 — Evidence search (three passes per ticket)

1. **Requesting customer.** Search Format insights for this issue, filtered to the requesting company, within the window. Use semantic search built from the description content, plus keyword search for distinctive terms (product names, integration names).
2. **Attached customers.** Same search for each customer already attached to the ticket.
3. **Broad sweep.** Take the insights found in passes 1–2 and search for semantically similar insights across all other companies (semantic search seeded from the actual insight text, not keywords guessed from the description). Fall back to keyword search only if passes 1–2 found nothing to seed from. Dedupe against passes 1–2.

Every piece of evidence carries: **verbatim quote, company, person, conversation date, Format insight link** (the insight's shareUrl). Always the Format insight link — never a raw call-recording, CRM, or other source link. The insight link shows the evidence in context and is the audit trail for every claim.

### Quote integrity — hard rule

Quotes are copied **character-for-character** from the Format insight. Never paraphrase, trim into different words, or reconstruct from memory. If a quote is long, use it in full or pick a different insight. Every quote must survive someone clicking the link and comparing. A single misquote ends the team's trust in the whole system.

## Step 5 — Relevance filter

Sort every found insight into two buckets:

- **Exact match** — the customer is asking for the same thing this ticket describes.
- **Related but not the same** — similar area, different ask (e.g. survey timing on email when the ticket is about surveys on chat).

Only exact matches enter the drafted section. Related ones are listed in chat for the user to judge — never written to the ticket unless the user says so. When unsure, bucket as related. Never pad thin evidence to make a ticket look better supported than it is.

## Step 6 — Draft the enrichment

Per ticket, draft a section to **append at the bottom of the description**. Exact format:

```
**Format Evidence** (via Format, updated {date})

Requested by {N} companies: {company list}. {M} insights from {P} people.
First raised {date}, most recent {date}. Requests are {accelerating/slowing/steady}: {X} mentions in the last {recent window} vs {Y} in the prior {earlier window}.

"{verbatim quote}" — {person}, {company}, {conversation date} — [Format insight]({link})

"{verbatim quote}" — {person}, {company}, {conversation date} — [Format insight]({link})

...up to 5 insights...

Similar insights from {Company A} ([Format insight]({link})), {Company B} ([Format insight]({link}))
```

Rules:

- **Quant block.** Companies listed by name. Insight count and distinct people count both stated — 8 insights from 1 persistent person and 8 from 6 people are different prioritisation calls.
- **Trend line.** Compare mentions in the most recent third of the search window against the earlier two thirds (90-day default: last 30 days vs prior 60). More recent than earlier = "accelerating", fewer = "slowing", roughly even = "steady". Always state the comparison explicitly ("5 mentions in the last 30 days vs 3 in the prior 60 days") so the claim is self-verifying. **Fewer than 3 total insights = omit the trend line entirely.** Two data points is not a trend, and a wrong trend call costs credibility.
- **Evidence cap.** Include the **5 most recent** exact-match insights. If more exist, add one closing line: "Similar insights from {Company A} (link), {Company B} (link)" — one link per additional company, pointing at that company's strongest insight. The quant line already carries the full count.
- **Append-only.** The section goes beneath all existing text. Never modify, reorder, or delete anything already written in the description.
- **Replace on re-run.** If a Format Evidence section already exists from a prior run, replace that section only (from its header to the end of the description) with the fresh version. Never stack a second section.
- **No effort or complexity estimates.** Ever. Not even hints. Effort cannot be judged from the request alone, and the skill must not pretend otherwise.

## Step 7 — Approve, then write

Present tickets **one at a time** so each decision stays small. Per ticket:

> **Ticket 1 of 6: Acme - Surveys - missing surveys for chats**
>
> Found 4 exact-match insights across 3 companies. Proposed section to append below the existing description:
>
> {the drafted section}
>
> Also found 2 **related but not exact** (not included): {one-line summary each}. Want either added?
>
> **Append this section to the ticket?** (yes / edit / skip)

Valid answers: **yes / edit / skip**. On "edit", revise per the user's wording and re-show. The user is tuning the instructions and wording — treat edit requests as calibration, and apply the same preference to later tickets in the run.

**On yes: re-fetch the ticket description at write time** and append to the fresh version — never to the copy read at the start of the run. Someone may have edited the ticket while the user was approving earlier tickets; writing a stale copy would wipe their edit.

### Attach follow-up (separate approval)

If the broad sweep found customers with the same ask who are not attached to the ticket:

> Globex and Initech raised this but aren't attached to the ticket. Both exist in your Linear Customers list. **Attach them?** This changes the aggregated revenue figure on the ticket. (yes / no / pick)

Rules:

- **Lookup-only.** All their customers already exist in Linear's Customers object. Find the existing entry and link it. **Never create a new customer entry.**
- If a Format company has matching evidence but no entry in the Linear Customers list, flag it and do nothing:

> Heads up: Umbrella has 2 matching insights but isn't in your Linear Customers list, so I can't attach them. Worth adding them to the list — right now they're invisible to your revenue aggregation.

- Kept separate from the append approval because attaching customers changes the revenue number the meeting prioritises on.

## Step 8 — Zero evidence

If a ticket turns up nothing in the window:

> **Ticket 4 of 6: Initech - Reporting - export scheduling**
>
> No evidence found in Format for the last 90 days. Did this request come in on a call or by email? If email, can you confirm it's logged in your CRM? If it's there and still missing from Format, flag it to the Format team. Skipping this ticket for now — nothing to write.

This turns a dead end into a diagnostic: it either surfaces a CRM email-logging gap on the customer's side or an ingestion problem on Format's side. Never pass over an empty result in silence, and never assert the cause — ask.

## Step 9 — Resumability

Approvals and writes happen per ticket, so completed tickets are safe if the run dies partway. If a run is interrupted and restarted, say where it stopped and offer to resume:

> The last run stopped at ticket 4 of 6. Resume from ticket 4?

Never redo tickets that were already written. The replace-on-re-run rule in Step 6 makes an accidental full re-run harmless, but don't rely on it — resume where the run left off.

## Step 10 — Wrap up

End every run with a summary:

> Done. 4 tickets enriched, 1 skipped (no evidence), 1 skipped (you declined). 2 customers attached. 1 flag: Umbrella missing from your Customers list.

Cover: tickets enriched, skipped, declined; customers attached; flags (companies missing from the Customers list, suspected data gaps).
