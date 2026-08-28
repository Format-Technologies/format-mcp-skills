---
name: format-demand-trigger-research
description: >
  Report on what made customers start looking for a solution like yours, over
  a period the user names — the moment something broke, the tool that hit a
  wall, the mandate from above, the peer who showed them, or nothing at all
  beyond an outbound call that landed. Reads voice-of-customer evidence in
  Format, ranks the trigger patterns by how many companies each reaches,
  segments them by what those buyers were trying to fix, and writes an
  authored Format report where every claim carries the customer's own words.
  Read-only except the single report it authors, left as a draft. Trigger
  phrases: "demand triggers report", "why did customers come to us", "what
  made people start looking", "what drives buying decisions", "why now",
  "what triggers demand", "why are prospects evaluating us", "what prompted
  them to look", "buying trigger analysis".
metadata:
  display_order: 110
  title: Demand Trigger Research
  personas: [marketing, product, sales, leadership]
  image: card.png
  use_case: >-
    Find out what actually starts a buying cycle — the moment, the breakage,
    the mandate, the recommendation. Get the patterns ranked by how many
    customers each reaches, split by what those buyers were trying to fix, as
    a Format report where every claim plays back the quote it came from.
  limitations: >-
    Reports what customers said started their search; it doesn't measure
    channel attribution or predict pipeline. Needs enough conversations in the
    period to be representative — a thin period makes a thin report, and the
    report says so rather than padding. Roles come from what Format knows
    about each person, which is usually partial.
  prompts:
    - "What made customers start looking for us, over the last quarter?"
    - "Build me a demand triggers report for the first half of the year."
    - "Why are prospects coming to us right now, and does it differ by buyer?"
---

# Demand Trigger Research

## 1. The question, and why it is hard

Every deal starts with a moment. Something broke, someone new arrived with a
mandate, a tool hit a ceiling, a peer said a name over lunch. That moment
decides where you need to be present, what you need to say when you get
there, and which problems are worth building for next year.

It is also the fact that disappears fastest. It gets said once, early, in a
discovery call, and then never again — by the time the deal closes everyone
is talking about pricing and security review. So the honest answer lives
scattered across hundreds of conversations nobody re-reads.

This skill produces one **Format report** answering that question over a
period the user names, built from what customers actually said, with every
claim traceable to the person who said it.

## 2. Scope — derive what you can

Three things to pin down. Derive them; ask only when the answer is
load-bearing and genuinely unfindable.

**The period.** This is the skill's main parameter and usually the only thing
the user says out loud ("last quarter", "this year", "since we launched in
EMEA"). Resolve it to dates, then check it against `describe_org`'s
`coverage` — if the org's conversations don't reach back that far, the report
covers what exists and says so on the cover. A period the data can't fill is
a finding about the data, not a reason to quietly widen the window.

**The topics that hold the answer.** Read `describe_org`. Look for the topic
asking why people started looking — orgs name their own topics, so match on
the question it asks, not on a name you expect. Then read its `definition`
with `get_topic`: the definition tells you what the topic was *meant* to
capture and, just as usefully, what it was meant to exclude. Triggers also
leak into neighbouring topics (market shifts, competitive comparisons, deal
blockers), so treat one topic as the centre of gravity, not the boundary.

If no topic asks anything like it, say so plainly and work from semantic
search across everything. A skill that silently reports on a different
question than the one asked is worse than one that says the question isn't
being listened for.

**What's actually connected.** `describe_org` lists sources with their record
counts and the CRM attributes available for segmenting. A source that is
connected but holds nothing is worth one line in the report — absence read as
"no signal" is the most common way these reports mislead.

State the resolved scope in a line as you begin, so a wrong derivation costs
seconds rather than the run.

## 3. Research

### Start with the shape, then verify down into it

`search_insight_groups` on the topic returns the trigger patterns already
clustered across customers. That is the spine of the report and the fastest
route to a real answer — a handful of archetypes with `customerCount` on
each, ranked by reach.

Two rules that keep the numbers honest:

- **`customerCount` is the ranking basis, and it never sums.** Groups nest. A
  customer inside a narrow group is counted again in every broader group
  above it, so adding the counts produces a number that means nothing. Rank
  with them; never total them.
- **Drill before you trust.** `search_insights({ supportingGroupId })` reads
  the actual statements under a group. A group's label is a summary written
  from the members, not evidence in itself.

When `hasGroups` is false, or the topic's groups are visibly thinner than its
neighbours', grouping hasn't caught up. Work from insights, and say in the
report that the patterns are your reading rather than the org's own
clustering.

### The over-capture problem — read this before quoting anything

**A demand-triggers topic collects far more than demand triggers.** This is
the single biggest threat to the report's credibility, and it is not a bug
you can filter your way out of.

Extraction reaches for anything that sounds like buying signal, so the topic
fills up with adjacent material: retrospective praise for a feature, an
objection that stalled a deal, logistics about booking the next call, general
expressed interest. Each one *reads* like it belongs. None of them answers
the question.

The test, applied to the quote cold and without its label: **does this name a
moment, a pain, a mandate, or a route in?** "We started looking because
manual QA was eating two days a week" passes. "The heatmap is very good"
does not, however positive it is. "Send me the commercials" does not, however
promising.

`isAiRejected: false` removes the worst of it and is worth pinning. It does
not finish the job — plenty of survivors are still not triggers. Read the
statements. Topic membership is a hint about where to look, never evidence
that something belongs.

### Angles worth running

Work them until new angles stop surfacing new companies, then stop and note
where saturation landed.

- **The trigger's own shapes**, as `semanticQuery` lanes in customer language:
  the thing that broke · the thing that grew past what they had · the tool
  that hit a wall or the vendor that vanished · the mandate from a new leader
  or a regulator · the person who showed them · the budget cycle that opened.
- **Absence as a finding.** Probe for the people who had no trigger at all —
  who took the meeting because someone called them. In an outbound-heavy
  business this is one of the most valuable things the report can measure,
  and nobody asks for it.
- **`find_similar_insights`** when one statement looks like the tip of a
  pattern the groups missed.
- **Feed the words back.** The first pass shows you the vocabulary customers
  actually use — a competitor's name, a metric, an internal job title.
  Observing a word is not the same as searching on it.

### Who was talking, and what were they trying to fix

The user will almost always want this cut by buyer. Two axes are available
and they are not equally good.

**Role** — `get_person` carries `identity.jobTitle`, `seniority`,
`department` and `focusAreas`, researched by Format. Where it exists it is
excellent. Coverage is usually partial, sometimes badly so, and it skews
toward people who talked most. **Treat role as enrichment, never as the
spine.** Check coverage before you plan a section around it: if you can only
resolve a third of the voices, a role breakdown is a chart with a hole in it.

**What they were trying to fix** — the better axis, and the one most agents
miss. It is in the evidence itself, so coverage is near-total. Buyers cluster
by the problem they came to solve, and that clustering usually maps onto the
seller's own product lines without anyone having to say so. Derive the
segments from the org's data; never import a taxonomy from outside it.

**Prospect versus customer** — worth having, because "what makes someone
start looking" and "what makes someone expand" are different questions
wearing the same clothes. Where the org maps a lifecycle attribute, use
`includeCompanyAttributes` and `attributeFilters`. Two cautions:

- CRM values sometimes arrive as raw stage ids rather than words. **If a
  value is not a word, it is not a segment** — don't print it.
- Use `valueAt: "atConversation"`. Someone who is a customer today may have
  been a prospect when they explained why they came looking, and today's
  label would file their answer under the wrong question. Read `historyFrom`
  on the attribute: history is a lower bound, so treat the split as
  approximate and say so if it carries weight.

### Counting

- **Count companies, not insights.** One statement is filed under every topic
  it touches, and one person repeats themselves across a call. Insight counts
  inflate; company counts are what a reader can check.
- **Every published number must be reproducible from a list you could name.**
  If you can't produce the companies behind a figure, don't publish the
  figure.
- **Some evidence has no company attached** — an inferred company carries no
  id and can't be counted into a company figure. Set those aside for the
  narrative and say how many you set aside.
- **Trend words are numbers in disguise.** "Most", "a surge", "increasingly" —
  compute the count or cut the sentence.
- **Never put two differently-derived counts into one ratio.** A group's
  `customerCount` and a filtered `count_insights` breakdown do not share a
  base, so "5 of 98 companies" invents a proportion neither number supports.
  Report them as separate figures, or derive both sides the same way first.
  This is the easiest sentence in the report to challenge and the easiest to
  write by accident.

## 4. Turning the evidence into an argument

A report that lists five patterns of equal weight has not answered anything.
The research gives you a distribution; the report needs a through-line.

Things worth looking for once the evidence is in:

- **The dominant pattern.** Usually one archetype reaches several times more
  companies than the rest. That is the messaging answer and it should lead.
- **The distribution itself.** How demand splits is often more interesting
  than what tops the list — a long tail of one-off triggers says something
  different from two patterns splitting the market.
- **The pattern you expected and didn't find.** An archetype the company
  believes in that the evidence doesn't support is a finding, and an
  uncomfortable one worth stating carefully.
- **Where the segments disagree.** If two kinds of buyer arrive for different
  reasons, that is the section the reader will act on.

Then say what you couldn't see, in the fewest words that let a reader judge
the evidence. State each gap flat and move on: no apology, no explaining why
the gap matters, no reassurance about what it doesn't undermine.

**Keep it proportionate.** Limitations should be among the shortest parts of
the report, never a section rivalling a finding. A few lines covers it: the
window, the sources that were empty, what didn't resolve. When a gap bites
one section only, a single line inside that section beats a paragraph at the
end. Everything else belongs in `handoff`, which exists for exactly this.

**A negative result is a finding, not a limitation.** "Nobody said budget
started their search" is something you learned about customers, so it sits
with everything else you learned about customers. Limitations are facts about
the data, never facts about the market.

## 5. Writing the report

`create_report`'s own description is the authoritative guide to blocks,
chips, cover fields and the mistakes to avoid — including the reach-bar chart
pattern, which is exactly right for ranking trigger archetypes by company
count. Follow it; nothing here restates it.

What it can't tell you is how *this* report should read.

**Shape.** No fixed template — the evidence should decide. But a shape that
tends to work: the answer up front, then one section per trigger pattern
ranked by reach, then the segment cut, then what the period couldn't show.
Three to six sections. Depart from it when the data argues for something else
and say why in `handoff`.

**Give the reader somewhere to rest.** A section built of three long
paragraphs is a wall, however good the sentences are. Whenever a section
covers several distinct things, split it: a **bold run-in label** opening
each paragraph names what that paragraph is about and lets a skimmer find it.
Where the same dimension repeats across companies, a table beats prose. Where
items are parallel and short, a list beats a sentence with commas in it.
Aim for a page a reader can scan and still get the findings.

**The quotes are the argument.** This report exists because someone will
challenge it. A claim about why customers came looking, with no customer
saying so, is an assertion with a number next to it. A full insight block
only where a quote genuinely carries the section; several in a row read as a
wall of cards.

**Ration the chips in prose, not in tables.** A chip behind every clause
turns a paragraph into a stream of interruptions and the prose stops being
readable. Two or three per paragraph is plenty, and wanting more is the
signal the material is a table. A table is the opposite case: it exists to
carry many references at once, so every company named in a cell is a
`{{company:<id>}}` mention, not plain text, exactly as it would be in a
sentence. A company column of bare names is a table the reader cannot click
into.

**Give the reader the number, not how you got it.** The report says what
customers did and said; it does not narrate the query behind it. "38 prospect
companies and 26 customer companies" is the finding. "Splitting on Format's
inferred company status, 38 prospect companies…" makes the reader step
through your method to reach it. Same for "probing for X returned", "the
breakdown shows", "enrichment is thin". Method, tool names and Format's own
vocabulary — insights, topics, groups, enrichment — belong in `handoff`. Name
the basis in the body only where a figure would be misread without it, and
then in a clause, not a sentence.

**Length is a feature.** These reports get forwarded or they achieve nothing.
Something a busy reader finishes beats something thorough they abandon. Cut
anything that doesn't move the answer forward.

**Don't recommend.** Present what customers said and let the reader conclude.
They know their roadmap, their pipeline and their constraints; you know the
evidence. Ending on the questions the evidence opens is more useful, and more
honest, than ending on advice.

**Voice.** Plain words, the way people actually talk about customers. Three
registers to watch, and the third is the one that survives editing:

- *Analyst* — "engaged accounts", "the cohort", "demand signals across the
  window", "exhibits a bimodal distribution". A person says "the 43 companies
  above", "before June", "they split into two groups".
- *Drama* — "the story of the quarter", "a stark warning", "the clock is
  ticking". Write the fact. If the figures carry tension, the reader feels it
  without being told.
- *Narrator* — the hardest to see, because it reads as thoughtful. It is the
  author appraising the evidence instead of presenting it, and it lives in
  the sentences between the facts. Cut the appraisal and keep the fact:

  | narrating | reporting |
  |---|---|
  | "The striking thing is how often people volunteer the figure." | "People volunteer the figure unprompted." |
  | "Under it sits a second complaint, and it is the one that actually moves people." | "A second complaint sits under it." |
  | "Read them and they divide cleanly." | "They divide in two." |
  | "Two said so with unusual candour." | Quote the two. |
  | "Small, but worth reading for what they are." | "Peer proof reaches five companies, conferences four." |
  | "The recurring shape is worth sitting with." | Describe the shape. |
  | "This is the number worth checking against the pipeline." | "Five, in an outbound-led motion." |

  Watch the constructions, not only the words: *worth ___ing*, *this is the
  one that*, *the X is the finding*, *it is worth naming that*. Each is a
  sentence whose only job is to rank the next fact for the reader.

The through-line belongs in the `conclusion` and the section headings. Below
those, state findings and let them accumulate — no scene-setting, no telling
the reader which fact matters, no sentence whose only job is to introduce the
next one.

Two mechanical checks before you write the cover, where all three registers
creep in hardest:

- **No em dashes anywhere in the report.** `create_report` bans them in
  `title` and `conclusion`; hold the whole document to it. A comma, a full
  stop or a colon does the job.
- **"Not X, but Y" in the conclusion or nowhere.** The contrastive snap is a
  good sentence and a bad habit; four of them in a report stops being
  emphasis and becomes a tic. Allow it one place, the conclusion, and write
  every other instance flat.

**Before you commit**, `validateOnly: true` catches structural problems
without persisting. Read any `advisories` that come back on the write; they
are the renderer's view of a page you can't see.

## 6. Handing it back

The report is the deliverable. The message you write alongside it is a door
into the report, not a second version of it. Anything a reader needs is in
the report; anything the next run needs is in `handoff`.

Three things, and little else:

- **What you found**, in two or three sentences. The dominant pattern with
  its number, and the one thing that would surprise them.
- **The link**, and that it is a draft nobody else can see yet.
- **An invitation to change it** before they publish.

Leave out the scope restatement, the tour of data-quality problems, the note
on which conclusions are yours rather than the org's clustering, and the
explanation of how series numbering will render. Every one of those is
already written down somewhere the reader can reach, and repeating it in chat
doubles the length while adding nothing.

One exception, kept to one line: a gap the operator could actually fix, such
as enrichment that has never run or CRM history too shallow to use. They can
act on it, and nobody opens `handoff` unprompted. One line, not a table.

Don't apologise for the data. Reporting what the corpus could and couldn't
support is the job, and it is already done in the report.

## 7. Re-runs

Default to a **series**: each run is an edition covering its own period, so
this quarter sits beside last quarter and the two can be read against each
other. `create_series` once, then pass `seriesId` on each new edition.

When a run is plainly a redo of the same period — more data has landed, or
the last pass missed something — deepen that edition instead:
`get_report` → revise → `replace_report`. `replace_report` swaps the entire
block tree, so send the whole revised document; anything omitted is deleted.

A later edition should be able to say how demand shifted, but only when the
periods are genuinely comparable. Two windows of different lengths, or a
window that ingestion was still filling, don't support a trend sentence.

## 8. Working principles and edge cases

- **Leave it a draft.** Publishing is the user's decision, always.
- **A thin period is a result.** Twenty conversations produce a short report,
  and that is the finding. Don't pad, and don't widen the window to rescue it
  without saying you did.
- **Read-only apart from the one report** you author.
- **Exclude the org's own people** from every figure. Their words are in the
  transcripts too, and they are not customers.
- **Data still landing.** If the period reaches up to today and ingestion is
  ongoing, the most recent stretch is thinner than it will be. Say so, or the
  next run looks like a contradiction rather than an update.
- **The org has no trigger-shaped topic.** Say so, work semantically, and
  suggest the topic — a standing question would make every future run better.
- **Everyone arrived the same way.** One dominant archetype and nothing else
  is a real answer. Report it, and look hard at whether the corpus is one
  segment rather than the market.
- **A famous brand name that doesn't fit its domain**, or a company profile
  describing the wrong subject, means identity resolution went wrong on that
  record. Don't build a segment on it; leave it out and note it.

## 9. What a good run looks like

- The period was resolved to dates and checked against real coverage.
- The topic was found by the question it asks, and its definition was read.
- Every statement in the report answers "what made them start looking" —
  verified by reading it, not by trusting its topic.
- Patterns are ranked by companies reached, with no summed nested counts, and
  every figure traces to a list you could produce.
- The buyer cut runs on what they were trying to fix; role appears only where
  it actually resolved, with its coverage stated.
- No figure is a ratio built from two differently-derived counts.
- Claims carry the customer's words. Full embeds are rare and earned, and no
  paragraph is carrying more chips than prose.
- Sections a reader can scan: run-in labels, tables and lists where the
  material is parallel, rather than long unbroken paragraphs.
- Limitations are short, flat and unapologetic, and shorter than any finding.
- No recommendations, no narration, no analyst-speak or drama, cover fields
  included. No em dashes, and at most one "not X, but Y".
- The report is a draft, in a series, and `handoff` records the searches, the
  saturation point, the companies behind each figure, and anything set aside.
