---
name: format-analysis
description: "Use before answering anything from Format's customer-conversation data, and alongside whatever you are producing from it — a brief, a ticket write-up, a report. The method: form the question, orient once with describe_org, pick the altitude (search_insight_groups for themes, search_insights for evidence, count_insights for magnitude, find_similar_insights to probe, ask where the connection has it), narrow the filter instead of paging deep, verify every number with a count, read a failure body before retrying, and keep evidence honest — customers' own words, ids carried, one voice never reported as a theme. Skipping it ships counts taken off a page, demand inflated by counting one remark under every topic it was filed under, and quotes that misread the verdict and resolution flags they carry. Triggers on 'what are customers saying about…', 'how many customers asked for…', 'is X a real theme or one loud account', and on any Format search you are about to summarise for a human."
metadata:
  display_order: 5
  version: '1.0.0'
  title: Analysis Method
  personas: [customer-success, sales, marketing, product, leadership, research]
  image: card.jpg
  related: [format-report-authoring]
  use_case: >-
    Get true answers out of your customer conversations rather than plausible
    ones. This is the method behind every other Format skill: how to frame the
    question, pick the right altitude, keep the numbers honest, and cite real
    customers instead of a paraphrase. Read it alongside whatever you are
    producing.
  limitations: >-
    A method, not an output — it produces no document of its own. Needs a
    Format connection with read access. It will not invent what a workspace
    does not hold; where the data is thin it says so rather than filling the
    gap.
  prompts:
    - "Using the Format analysis method, what are customers saying about onboarding in the last 90 days?"
    - "How many distinct customers have asked for bulk export? Show your working."
    - "Is pricing confusion a real theme in our conversations, or one loud account?"
---

# Analysing with Format

Format holds what customers actually said. This is the method for turning that
into an answer someone can act on rather than a confident wrong one. Read it
alongside the skill doing the work — it is the evidence half of every Format
skill.

## 1. Form the question before you search

Write it in one sentence, naming the **population** (everyone, one segment, one
account?), the **window**, and the **shape of the answer** (a ranking, a
number, verbatim evidence, a yes/no?).

## 2. Orient once

`describe_org` first, every time. One call, and it bounds what the session may
honestly claim:

- **`topics`** — the standing questions this org asks of every conversation.
  Format captures only what a topic listens for, so a domain no topic covers
  produces silence that means nothing.
- **`coverage`** — the first and last conversation. If the asked-for window
  falls outside it, say so before searching.
- **`attributes`** — the filterable company and person fields, spelled as
  `attributeFilters` takes them.
- **`processing`** — `hasGroups: false` means nothing here has been gathered
  into themes **at all** — an empty theme search then says nothing about your
  question; the evidence is in `search_insights`.

Pass `orgId` on every call if your connection reaches more than one workspace —
the default is arbitrary. `list_organizations` enumerates them; every response
echoes the `org` that answered.

## 3. Choose the altitude — the tool is the dial

There is no level parameter. The verb you call is the altitude you get.

| The question | The call |
| --- | --- |
| What runs across customers — themes, rankings | `search_insight_groups` |
| What one person actually said, in their own words | `search_insights` |
| How big is this — sizing, cross-tabs | `count_insights` |
| Who else said something like this | `find_similar_insights` |
| The user's whole question, routed for you (not on every connection) | `ask` |

Re-read what you already hold by id: `get_insight` / `get_insight_group`, or
`insightIds` on a search.

**Never page a search to count it.** `count_insights` answers "how many" in one
call and cross-tabs by `company`, `person`, `dataSource` or `topic`.

**Rank from groups, quote from insights.** A group's `customerCount` is the
basis for "most" and "biggest"; pass its `id` to `search_insights` as
`supportingGroupId` for the words underneath. Group ids are handles for this
conversation only — never write one into a document or a scheduled job.

**`ask` is not on every connection — check your tool list.** Where present, it
takes the user's question close to verbatim, routes it server-side, and says in
`interpretation` how it answered — read that before narrating.

**`find_similar_insights` probes a hypothesis** from one strong hit:
`relationship.kind: 'shared_group'` is Format's own analysis, a finding;
`'semantic'` is wording alone, a suggestion.

## 4. Narrow — don't page deep

Ranking and superlative questions are answered from the first page; everything
else is better narrowed on topic, company, date or keyword. Searches refuse to
serve past offset 1000 — depth is a sign the filter needed tightening.

When you do page, **`nextOffset` is the next page's offset, or `null` when there
is no next page.** Never compute it from `count`: a page can come back shorter
than `limit`, because rows restating a row already on it are folded away.

## 5. Verify the claim you are about to make

Before a number goes into an answer, ask the surface for it. "Twelve customers
want this" → a group's `customerCount`, or
`count_insights({ breakdownBy: "company" })` — read `breakdownBucketCount`, the
bucket count; `count` is insight rows. "Nobody mentions X" → one
`count_insights` over the widest range before calling it silence.

An empty result names its own cause: `emptyReason` is `filtered_out` (data
exists; your filter missed it), `no_groups_yet` or `empty_org` — only the last
means there is nothing to say. A failure likewise names what was invalid, what
is valid and which call comes next; read it rather than retrying or guessing.

## 6. Evidence hygiene

- **Quote the customer's words** from the insight, never a paraphrase dressed
  as a quote.
- **Carry the ids as you gather**: insight `id`, `company.id`, `person.id`,
  `record.id`. Going back for them later is what makes an answer uncitable.
- **One voice is not a theme.** "A customer said" for one insight; "customers
  say" only when several distinct customers did — and say how many.
- **Hedge inferred attribution.** `company.source` is `linked` when Format
  knows the customer, `inferred` when the name was only read out of the
  conversation — an inferred one has a `null` id and spelling variants, so
  count by normalised name.
- **Say what you could not see**: the window, the unattributed share, the
  topics that were not listening. A stated limit makes the rest trustworthy.

## The six ways to be confidently wrong

Each is explained in full by the parameter or field beside it.

- **Paging** — `nextOffset` is the next page's offset, or `null` when there is
  no next page; never compute it from `count`.
- **Counting across topics** — one statement is counted once per topic it was
  filed under, so topic buckets never add up to distinct things said;
  `count_insights` states what its total counts.
- **`isAiRejected`** — `false` includes insights never judged, `true` includes
  the undecided.
- **`lifecycleStates`** — how active a theme is now, not how important; leave
  it unset for ranking questions.
- **`valueAt: "atConversation"`** — matches only conversations with an
  observation at or before them, so read it as a lower bound.
- **`hasResolutionClaim: true`** — somebody promised it was handled; the need
  stays open.

## Handing off

Writing the analysis up as a Format report is its own craft: read
`format-report-authoring` before your first authoring write —
`get_skill('format-report-authoring')` serves it, the gallery otherwise. And
when this surface fails you, `send_feedback` reaches the team that builds it.
