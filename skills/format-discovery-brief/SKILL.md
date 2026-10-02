---
name: format-discovery-brief
description: >
  Use when a product manager is about to start discovery on one product area, feature
  or phase of the user's work and wants what customers have already said about it,
  before any interviews. Takes the area in the PM's own words ("exporting data", "onboarding a new
  client", "permissions and roles"), searches the conversations
  in Format by meaning, clusters what came back into problems in the customer's own
  terms, ranks them by how many distinct companies raised each with a customer and
  prospect split, reads the calls behind the biggest problems for the moment it bit,
  the workaround and the cost, and writes it all up as a Format report the PM can
  share and iterate on. Triggers on "discovery brief for [area]", "what do customers
  say about [feature]", "problems behind [area]", "brief me on [area] before we
  build", "pain points for [phase of the work]". Produces evidence, ranked; it never
  recommends what to build.
metadata:
  display_order: 22
  title: Discovery Brief
  personas: [product]
  image: card.jpg
  related: [format-ticket-research, format-roadmap-check, format-report-authoring, format-analysis]
  use_case: >-
    Start a discovery from what the calls already hold instead of from scratch.
    Name an area in your own words and get back the problems customers describe
    in it, each ranked by how many companies raised it, with every quote linked
    and, for the biggest problems, how it happens on the ground and what people
    do about it today.
  limitations: >-
    Ranks evidence; it does not recommend what to build or score demand. One area
    per run. The customer-versus-prospect split needs a CRM status field synced
    into Format and is only as complete as that field. Coverage is whatever
    sources are connected, and the brief says which ones were and were not
    searched. Needs report authoring enabled on the connection to write the
    report; without it the brief is delivered in chat.
  prompts:
    - "Discovery brief for exporting data."
    - "What problems do customers describe around onboarding a new client? Run the discovery brief."
    - "Brief me on permissions and roles before we plan the next quarter."
---

# Discovery Brief

## What this skill does

Given one area, it finds what customers and prospects have said about it across every connected conversation, groups those statements into problems in the customer's own terms, ranks the problems by how many distinct companies raised each, reads the calls behind the biggest ones, and writes a Format report with one subsection per problem and every row of evidence behind the count.

It is the front half of a discovery, done before any interview. The PM takes the ranked problems and the quotes into the discovery and refines the solution from there. The brief never proposes the solution.

## Inputs

- **Required:** the area, in the PM's words. A feature name ("CSV export"), a product area ("permissions and roles"), or a phase of the user's work ("onboarding a new client"). Any form works; the skill writes the job sentence from it.
- **Optional:** a time window. Default is everything in the organization.
- **Found at run time, never asked for:** the organization (`list_organizations`; if more than one is reachable and the area does not make it obvious, ask), the sources and their start dates (`describe_org`), and the attribute that separates customers from prospects (`describe_org`, see step 2).

Read `format-report-authoring` before writing the report; it is the rubric the report is reviewed against. If it is not installed, `get_skill("format-report-authoring")` on the Format connection serves it. One rule in it is overridden here on purpose: the title is a fixed label, not a question, so editions sort together.

## Workflow

Say up front that this is a long run: a sizing pass, transcript reads for the biggest problems, then the draft. Where your tool can delegate, give each transcript read to its own helper and launch them together.

### Step 1. Resolve the area

- Write one sentence on what the user is doing in this area ("an admin is setting up a new team member and has to decide what they can see and change before they start") and say it before searching. That sentence drives the search, so the output comes out by job even when the input was a feature name.
- Expand into search phrases: the area name as given, the names customers use for it on calls (take these from the first page of a keyword search on the area name), and three to five plain-words phrases for the job and the ways it goes wrong.

### Step 2. Size it

- `describe_org`. Note the sources (each carries `type`, `isConnected`, `recordCount` and `lastRecordAt`, the newest conversation; there is no start date per source), the org-wide `coverage.earliestRecordAt`, and the company attributes. Pick the attribute that separates customers from prospects, whatever the organization calls it (Account Status, Lifecycle Stage, Customer Type). If there is none, the brief has no status split and the tables have no Status column; say so in the scope.
- `count_insights` with `keywordSearch: ["<area name>", "<what customers call it>"]` (an array of 1 to 10 strings) and `breakdownBy: "topic"`, as a rough size. It takes no semantic query.
- `search_insights` with `semanticQuery` on each phrase, with `topicNames` set to the organization's pain, complaint, request and use-case topics (typically "Pain Points", "Negative Feedback", "Feature Requests", "Use Cases"; `describe_org` lists the real names), `isAiRejected: false`, `includeCompanyAttributes: true`, `limit: 100`, at most two pages per phrase, passing the response's `nextOffset` as the next `offset` (never offset plus rows returned; pages come back shorter when one statement filed under several topics folds into one row). On a broad phrase `hasMore` stays true indefinitely, so the two-page bound is the rule, not the signal. If your tool caps tool output and saves a large page to a file, merge the files with a short script, dedupe by insight id, and work from a one-line-per-row listing.
- Keep per row: insight id, company id and name, whether the company is linked or inferred (`company.source`), person id, record id, topic, and the status attribute value.
- Do not use `search_insight_groups` as the frame. Groups are organised by need across the whole organization, and the top of the tree names nothing a PM can act on.

### Step 3. Cluster into problems

- Group rows by the problem the customer is describing, not by topic and not by the feature they proposed. A pain, a complaint about the existing feature and a request for a change belong together when they are the same problem.
- Name each problem in plain words, as a thing that goes wrong for the customer, under 10 words. Never present a Format group title as a problem name.
- Every insight goes into exactly one problem, and every company appears at most once in a problem's table. When one company said two things that belong to two problems, use a different insight for each. Build the assignment explicitly, insight id by insight id, and compute the counts from it; counts estimated from company lists before the assignment run high.
- For each problem: distinct companies, split by the status attribute into customers, prospects, former customers and no status, and the single best quote. Say the split is a floor when a large share of companies have no status set.
- A problem needs 2 or more companies. The ten largest problems with 4 or more companies get their own subsection, at most ten. Everything else with 2 or more companies goes into one "Smaller problems" subsection as a table. Problems with one company go to "Raised once".
- Drop rows about a different area, rows the AI filter rejected, and prospect questions of the form "does it do X" that were answered yes on the call. Those are enablement, not discovery.

### Step 4. Read the calls behind the biggest problems

For the top five problems by companies, read the record behind the best quote with `get_record` in full. For each, write three lines in the customer's terms: the moment it bit (what they were doing), the workaround they run today, and what happens downstream if it stays. If the transcript does not say, write "not said on the call". Never invent a workaround. If the read shows the quote is about something else (a different product, a competitor's trial, the vendor's own suggestion that the customer only agreed with), drop that row from the problem, recount, pick the next best quote and read its record; say in the handoff what was dropped and why.

### Step 5. Draft before authoring

Before writing the report, put in front of the user: the job sentence, the ranked problem list with splits, the smaller problems, the raised-once rows, the coverage sentence, and the cover word for word. Wait for them to cut. Edits happen here, not in the report.

### Step 6. Author

`create_report` in the organization, as a draft, following the layout contract below. The document runs to 50KB or more; if your tool cannot pass that in one call, write it to a file and have a helper read the file and make the call. Read back the `advisories` and fix what you agree with via `replace_report`. Never create a second report to revise.

Write a `handoff` covering: the area and the job sentence, every search phrase with its row count, every record read, every problem with its insight ids, the problems merged or dropped and why, the coverage at run time, and open threads, including any data issues found in the calls (a record filed under the wrong company, a quote that turned out to be about a different product).

If report authoring is not on the connection, deliver the same content in chat, sections in the same order, quotes as share links.

### Step 7. Read it back before showing the link

After the write, paste the cover word for word, then read every section summary, text block and table cell. Where you can, hand the cover and then the body to a helper that has seen nothing else, with only the text and this list, and fix what comes back after checking each rewrite against the source quote:

- A word or phrase added for effect that carries no information. Delete it and the sentence means the same.
- A metaphor standing in for the literal thing.
- Drama or praise: "striking", "stark", "key insight", a sentence that admires the finding.
- Corporate filler: "leverage", "friction", "stakeholders", "journey", "actionable", "alignment".
- An abstract noun with an abstract verb that tells the reader what to think before showing anything.
- A number or "most" the rows do not support.
- A cover sentence with nothing real in it. Every sentence of the conclusion needs a count or a named problem.
- A quote intro that summarises the quote instead of saying what happened.
- Em dashes. Headings that are claims or coined phrases.

Say what the pass changed. If it changed nothing, say that.

## Layout contract

Invariants:

- **Title** is fixed: "Discovery Brief: <the area as the PM gave it>". The label first so editions sort together; the PM's own words after the colon, never renamed. This overrides the authoring rubric on purpose.
- **Scope**, under 250 characters: "The problems customers and prospects describe around <area>, where <the user's job in a clause>, ranked by how many companies raised each. From <the source types, e.g. sales and support calls>; status is today's CRM value." Drop the status clause when there is no status attribute. No dates and no counts on the cover; the coverage block in the last section carries both.
- **Conclusion**, under 450 characters, an overview of the problems. First paragraph: the problem count and company count, then the top one or two problems with their counts. Second paragraph: the next six at most, each in two to four words with its count in brackets, then "and N more" if any remain. No recommendations, no named firms.
- **Chips everywhere.** Every company, person and record with an id is a `{{company:…}}`, `{{person:…}}` or `{{record:…}}` mention; inferred companies are plain text with "(inferred)". Insight chips inline; two full insight blocks in the whole report, never two in a row. A section's `summary` field is plain prose, no chips; chips there render as dead text. No standing callout.
- Problem tables have three columns; the Raised once table has four. The report schema caps a table at 50 rows and one row over fails the whole write. A problem with more than 50 companies gets its table split by status (customers, then prospects, then the rest); Smaller problems and Raised once keep the 50 largest or most recent rows and say in the line above how many were left out.

Sections, in this order. Level 2 sections carry the argument; level 3 sections carry the data.

1. **The problems, ranked by companies** (level 2). One bar chart, companies per problem. One table: problem in plain words, companies as "n: a <the org's word for customers>, b prospects, c former, d no status" with zero categories left out, one quote chip. Two or three sentences naming the top two and what the rest are about, then one full insight block on the top problem.
2. **Problems** (level 2, intro only). One text block: what a row is, what the quote chip opens, what "inferred" means.
3. **One level 3 section per problem, for the ten largest with 4 or more companies**, in ranked order. Each has: an overview as a text block, two or three sentences on what the problem is in the customer's terms with two to four companies as chips and no counts; a one-line intro with the split; a table with one row per company, columns Company (chip), Status, Quote (chip); and for the top five, a text block opening with a bold run-in "On the call." (text blocks take no headings) with the moment, the workaround and the cost, or "not said on the call". One full insight block across all these subsections, on the problem with the best read call.
4. **Smaller problems** (level 3), for every remaining problem with 2 or more companies: one line, then one table with a row per problem: problem name, companies as "n: split", one quote chip.
5. **Raised once** (level 3): one line, then a table: Company, Status, what they said in under ten words, Quote chip.
6. **What this brief is, and what it is not** (level 2). One text block: the unit is a problem in the customer's work, not a feature; the number is distinct companies with the status split as a floor; there is no tree below a problem, the rows are the evidence; the area is whatever the PM names. Then the coverage: the sources searched with their record counts, the org-wide earliest conversation date from `coverage.earliestRecordAt`, and sources connected but not searched or not connected at all. Never state a start date per source; `describe_org` does not have one.
7. Optional, only when the area had a release in the window and the user gives the date: **What changed after shipping**, from the complaint and praise topics on the feature since the release.

No chart beyond the one reach chart. No section on recommendations or solutions.

## Writing style

Plain words, the customer's terms, no corporate filler, no em dashes. Digits for counts. Use the organization's own word for its customers if it has one, in the tables and the split lines as well as the prose. A quote intro says what happened in the speaker's terms, never summarises the quote. Prospect quotes are marked as prospects in the intro.

## Constraints

- Read-only against Format except the one report. Never rate, never change a topic, never send or publish.
- One organization per run. Never pull from another to pad an area.
- Rank by distinct companies. Never by mentions, never by ticket counts from another system.
- The status attribute is today's value. Say so once in the scope.
- Never present a Format group title as a finding. Problem names are written fresh from the rows.
- No recommendations, solutions or priorities. The brief ranks evidence; the PM decides.

## Scope boundaries

- One area per run. Two areas means two reports.
- Not a ticket enricher. A pasted ticket or user story is `format-ticket-research`.
- Not a roadmap check. A list of planned items against the evidence is `format-roadmap-check`.
- Not a comparison against the team's own feature tree or tracker. If they want the brief scored against their tree, that is a separate run with their export as input.

## Edge cases

- **More than one organization reachable and the area does not say which.** Ask.
- **No status attribute.** Drop the split and the Status column, say so in the scope.
- **Fewer than three companies in the area.** Do not author. Report the rows with the coverage sentence and say the calls do not carry enough yet.
- **Mostly prospects.** Author, but the conclusion names the split. A prospect-only problem is a sales question, not a customer pain, and the prose says that.
- **Same quote under three topics.** One row, one company. Never three rows.
- **A row where the vendor, not the customer, raised the point.** Keep the quote only if the customer took it up; otherwise drop it, and never ground a problem on it.
- **A record filed under the wrong company.** Use the company the call is actually with, say so in the report and the handoff.

## Success criteria

- A PM can name the area in their own words, run it, and get a ranked problem list without knowing what a topic, a group or an attribute is.
- Every problem has a company count, a quote chip, and an overview in the customer's terms.
- The top five problems carry the moment, the workaround and the cost from a read transcript, or "not said on the call".
- The coverage sentence names what was searched and what was not.
- In a blind mix of the team's own ticket list and the brief's problems for the same area, the PM picks at least one brief-only item for a discovery call.
