---
name: format-analysis
description: "A guide for agents querying customer conversations through the Format MCP: how to navigate its tools, how to query, when to use what, what to be careful of, and the practices that keep an answer truthful, reliable and reproducible. Orient with describe_org first — its analysisGuide carries the reading rules and each tool description carries its own traps; this guide holds what they cannot: which sequence of calls answers which question, the traps that live between calls, and how to state a result so it can be re-run. Skipping it produces confident answers that do not survive checking. Use it on any Format search, and on 'what are customers saying about…', 'how many customers asked for…', 'is X a real theme or one loud account', 'is there evidence for this roadmap item', 'what has [account] been saying', and on any Format result about to be summarised for a person. It produces no document of its own; writing one up is format-report-authoring."
metadata:
  display_order: 5
  version: '2.0.0'
  title: Using the Format MCP
  personas: [customer-success, sales, marketing, product, leadership, research]
  image: card.jpg
  related: [format-report-authoring]
  use_case: >-
    A guide to using Format's MCP well: how to navigate the tools, how to query,
    when to use what, and what to be careful of — so the answers you get out are
    truthful, reliable and reproducible. The method under every other Format
    skill.
  limitations: >-
    A guide, not an output — it produces no document of its own. Needs a
    Format connection with read access. It will not invent what a workspace
    does not hold; where the data is thin it says so rather than filling the
    gap.
  prompts:
    - "What are customers saying about onboarding in the last 90 days?"
    - "How many distinct customers have asked for bulk export? Show your working."
    - "Is pricing confusion a real theme in our conversations, or one loud account?"
    - "Is there evidence for this roadmap item, and which accounts are asking?"
---

# Using the Format MCP

Format holds what customers actually said; this MCP is how you get at it. The surface
teaches itself — `describe_org` returns `analysisGuide`, and every tool and parameter
description carries its own traps. **Read those; this guide does not repeat them.** It
holds what they cannot: which sequence of calls answers which question, the traps
between calls, and how to write a result down so it is truthful, reliable and reproducible.

## 1. Before the first call

One sentence, naming four things:

- **Population** — everyone, one segment, one account?
- **Window** — and whether the data covers it.
- **Shape of the answer** — a ranking, a number, evidence in their own words?
- **The decision it feeds** — a floor, a distribution, or one articulate customer.

Then check it is askable. Format captures only what a **topic** listens for — the
standing questions this org asks of every conversation — so a domain no topic covers
produces silence that means nothing. Read `describe_org`'s topics once and carry them.
Pass `orgId` if your connection reaches more than one organization: the default is
arbitrary, and an organization's name is not its id.

## 2. Which call answers which question

Nothing on the wire says which *order* to call these in.

| The question | The sequence |
| --- | --- |
| A real theme, or one loud account? | the group's `customerCount`, then `count_insights({ breakdownBy: 'company' })` — one big bucket is one account |
| Is there evidence for this roadmap item? | `describe_org` (is a topic even listening?) → `search_insight_groups` → `count_insights` for the floor |
| What has this account been saying? | `list_companies({ nameSearch })` for the id → `search_insights({ companyIds, dateRange })` |
| Why does this account look at risk? | that, plus `get_company` — whose `signals` are never repeated back to that customer |
| Did the insight layer miss it? | `list_records({ keywordSearch })` searches the conversations themselves; `get_record({ includeInsights: true })` reads one; `get_insight` adds `followUp` |

**Keep every id you touch** — a Format report embeds them as live chips.

## 3. Where the counts mislead

- **A page is not a population.** Ask the surface for the number and name its basis
  when you write it down; the reader cannot see your denominator.
- **`count_insights` counts rows; `search_insights` folds.** One statement is filed
  once per topic it answers. On a `search_insights` page, `count + restatementCount` is
  what the same filter returns unfolded — and no call returns a distinct-statement
  count for a population.
- **Never sum `customerCount`.** To de-overlap, walk to the insights and count distinct
  companies.
- **Never ratio two differently-derived numbers.** "5 of 98 companies" — the 5 from a
  group's `customerCount`, the 98 from a `count_insights` breakdown — invents a
  proportion neither supports.
- **A group's numbers and an insight count are different populations**: the group side
  drops insights a reviewer rejected, the insight side keeps them.
- **Date bounds are inclusive at both ends**, so contiguous windows share a boundary
  and a row on it lands in both. Ask for the window you mean rather than stitching it
  out of weeks.

## 4. Building the query

- **`semanticQuery` is on `search_insights` only** — passing it to
  `search_insight_groups` fails the call. Proper nouns belong in `keywordSearch`
  anyway; its terms are OR'd, so a generic term beside a precise one drowns it.
- **Do not topic-scope an evidence search.** The extraction chose which topics a
  statement answers, rarely in your question's vocabulary, so `topicNames` silently
  drops the evidence you wanted. Narrow on company, date or keyword.
- **Do not pin `isAiRejected: false` on a counting question.** Each topic-twin of a
  statement was judged separately, so it keeps some copies and drops others, and the
  count moves when topic scope moves. No call here reproduces the set a report actually
  draws evidence from. Triage reading with it, and say so.
- **The rest of the traps sit in the parameters that carry them** — read the description
  before setting `lifecycleStates`, `valueAt`, `hasResolutionClaim` or
  `attributeFilterLogic`.

## 5. Silence, and what you could not see

`emptyReason` names three causes. The one it cannot name is that **no topic was
listening**: nothing was ever extracted, so the silence says nothing about your
question. Before writing "customers haven't mentioned this" — the claim that gets filed
as a product gap — widen once: drop the filters, try the name's spelling variants (a
name in a transcript is a phonetic guess), check the window edge.

Then say what you could not see: the window, the share attributed to no company, the
topics that were not listening, the filter you narrowed with. Stating them makes the
rest trustworthy and the query reproducible — and never report the insight layer's
silence as Format's. Go to the conversations before you write the absence claim: a
customer who reads "Format doesn't have it" writes it into an evaluation, and nothing
in your answer shows them the search was thin.

## Handing off

Writing this up as a Format report is its own craft: read `format-report-authoring`
before your first authoring write — `get_skill('format-report-authoring')` serves it,
the gallery otherwise. `rate_insights` is not part of answering a question. When this
surface fails you — or this guide does: a claim that did not match what a tool
returned, a question it left you unequipped for — say so via `send_feedback`, naming
`format-analysis`; it reaches the team that builds both.
