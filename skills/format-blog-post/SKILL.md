---
name: format-blog-post
description: "Use when writing B2B blog posts that rank in traditional search AND get cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Claude) — sourcing the original evidence from real customer conversations via Format MCP. Trigger phrases include 'write a blog post', 'draft a blog article', 'SEO blog post', 'AEO blog post', 'AI-optimized post', 'content brief', 'write about [topic]', or 'blog post from our customer data'. The skill proposes a post type and angle grounded in what the workspace's customers actually discuss, checks them with the user once, then writes an answer-first, extractable post whose citable substance — real quotes, honest counts, switching stories — comes from Format. Produces the post draft, the content brief, and an internal evidence appendix. Not for landing pages, ad copy, or case studies — different jobs."
metadata:
  display_order: 90
  title: AEO/SEO Blog Post
  personas: [marketing]
  image: card.jpg
  related: [format-company-context, format-case-study]
  use_case: >-
    Blog posts that AI answer engines cite because they contain something
    no model can fabricate: your customers' real words and honestly counted
    data. One checkpoint to agree the angle, then a publish-ready draft —
    answer-first structure, extractable sections, evidence appendix.
  limitations: >-
    The draft anonymizes customers to role/segment unless they're already
    publicly cited — final naming needs sign-off. Citation outcomes depend
    on distribution and domain authority, not the draft alone. Needs enough
    conversation coverage on the chosen topic to be evidence-backed.
  prompts:
    - "Write a comparison-style blog post grounded in what real users say about us vs the tools they came from."
    - "Draft an AEO-optimized post about [topic] using our customer conversations as the evidence."
---

# AEO/SEO Blog Post

## What this skill does

Most B2B blog posts never get cited by AI answer engines because they contain nothing an LLM doesn't already know. The posts that do get cited share three properties: they answer a specific question directly, they contain information AI can't fabricate, and they're structured so a clean passage can be lifted without losing meaning.

This skill builds that post — and sources the can't-fabricate layer from the Format workspace: verbatim customer quotes, honestly computed counts ("of N conversations naming a competitor, the top complaint was X"), and real switching stories. One checkpoint to agree what the post is, then it writes.

## Inputs

**Optional — use when present, don't ask for:**

- **A topic or angle** — if the user names one, the checkpoint refines rather than proposes.
- **Existing context** — if a Format company-context document (the `format-company-context` skill's output) is in the conversation, use its positioning, competitive landscape, and customer-language sections; don't re-derive them.
- **A case study** — if a drafted case study (the `format-case-study` skill's output) is available, it's ready-made story material.

## Stage 0 — Preflight: find the citable ore (3–4 calls)

Run cheap scans before proposing anything:

1. `list_topics()` — what this workspace listens for; competitive, inbound-driver, and feedback topics are the usual ore for posts.
2. `count_insights({ level: "aggregated" })` — whether aggregated themes exist. Judge by response shape, not the bare number; having none is normal and just means quote-level work.
3. One or two `count_insights` / `search_insights` probes on the candidate territory (e.g. competitor mentions, the recurring pain the user hinted at) — enough to know where the evidence is dense. Use `semanticQuery` probes too: topics are a lens, not the corpus.
4. Note the corpus's date span — the post will state the period its data covers.

## Stage 1 — Propose the post (one checkpoint)

Prepare and show together, in under a minute of reading:

**1. The post type**, picked for the query intent from the citation-strength table:

| Format | Best for | AI citation strength |
|---|---|---|
| Comparison ("X vs Y") | Buyer evaluation queries | Very high |
| How-to guide | Implementation/setup/migration queries | High |
| Definitive guide | "What is X" category education | High |
| Original research | Authority building, recurring citations | Highest |
| Listicle ("Best X for Y") | Commercial shortlist queries | High |
| Opinion / analysis | Thought leadership | Low unless data-grounded |

**2. The angle and primary answer** — the target query, and the one sentence you'd want an AI to quote.

**3. What the data offers** — one line per evidence block the preflight found ("412 insights mention competitors; Excel dominates at ~70 mentions across 40+ companies; strongest switching quotes are from finance leads"). The user should see the post is buildable before a word is written.

**4. The defaults** — working title, 4–6 H2 sub-questions, target length, and the attribution stance (anonymized to role/segment unless a name is already publicly cited — see Principles).

The test for what makes the checkpoint: include only what the user's answer could change. Take corrections, then run without further questions. If the user already specified type + angle precisely, keep the checkpoint to one short confirmation of the data offer and the defaults.

## Stage 2 — Gather the evidence (4–6 calls, quiet)

**Run quietly** — the checkpoint was the conversation; the draft is the deliverable.

1. **Pull the quotes.** `search_insights` with `semanticQuery` probes spanning pain language ("struggling with", "we used to"), solution language ("now we can", "what changed"), and comparison language ("switched from", "compared to") at `level: 0` — plus topic pulls where preflight found dense topics. Aggregated answers, where they exist, are shortcuts to theme + supporting quotes (`select: "extended"` → `supportingInsightIds` → level 0).
2. **Compute the counts honestly.** Every statistic in the post comes from `count_insights` or from counting fetched results — never from vibes. Count distinct companies, not raw rows (dedupe insights sharing a record); disclose overlap where two counts could double-cover ("N mentions of Excel or Sheets" needs an overlap caveat). A number that survives discounting is the headline; one that doesn't, isn't.
3. **Flag the zero results too.** "We expected Airtable mentions and found none" is itself a finding — report absence as fact, never pad it.

## Stage 3 — Write the post

### Structure (the extractable-chunk rules)

- **Answer first, everywhere.** The intro's first 2–3 sentences contain the direct answer. Every H2 leads with its answer, then expands.
- **H2s phrased as the questions people actually ask** ("How do finance teams outgrow spreadsheets?" not "Spreadsheet Limitations").
- **Paragraphs as extractable units**: 2–5 sentences, one idea, 40–60 words is the sweet spot, no orphan pronouns pointing at earlier paragraphs.
- **A "Where this data comes from" section** early in the post: what was analyzed (N conversation moments, the period covered, captured how) in plain language. This is the post's citability engine — it tells both readers and AI systems the numbers are real and theirs alone.
- **Tables for comparisons**, step lists for processes, an FAQ section (3–7 real questions, answers under 60 words, direct factual first sentence) — the highest-leverage extraction trigger.
- **One story or mini-case per post**, and opinionated edges — structure plus soul; consensus-committee prose reads as commodity to humans and rankers alike.
- For each major section, the baseline → tension → take pattern: the accepted view, what it misses, your data-backed resolution. The "take" is what gets cited.

### Voice

Specific situations over abstractions; first-person where lived experience exists; short sentences for punch; definitive phrasing where the data supports it ("X was named in 76 of 525 competitive conversations" gets cited; "many users mention X" does not). No invented statistics, no hedged mush.

### On-page layer

Title tag with the primary keyword early; meta description carrying the main answer; JSON-LD schema (`BlogPosting` always; `FAQPage` for the FAQ; `Person` for the author); "Last updated" visible. Author bio and competing-content audit are placeholders for the user — flag them, don't fabricate credentials.

## Stage 4 — Deliver

Three parts, in one document:

```
## The brief
[Topic, target query, post type, primary answer, H2 map, evidence summary —
the Stage 1 checkpoint, finalized.]

## The post
[The full draft, publish-ready except the flagged placeholders.]

## Evidence appendix — INTERNAL, strip before publishing
[Every quote used: verbatim original, speaker, company, date, Format share
link. Every computed count: the query that produced it and its caveats.
This is the audit trail for whoever signs off — it never ships publicly.]
```

Delivered inline, and as a markdown file where the environment can save one.

## Principles

These are the defaults that make the post citable and safe to publish. They're guidance, not law — depart when the situation genuinely calls for it, and say so when you do. The two exceptions that stay firm: quotes are never fabricated, and nothing in Format is modified or deleted.

- **Public attribution is earned, not assumed.** A customer is named (first name + company) only if they're already publicly cited in the user's materials; everyone else is anonymized to role/segment ("a RevOps lead at a 40-person SaaS company") — faithfully, never embellished. Critical or unflattering quotes are anonymized even when the speaker is publicly citable elsewhere.
- **Every statistic is computed, not asserted** — and carries its overlap/sampling caveats in the appendix. A post caught inflating one number loses every citation it ever earned.
- **Quotes are verbatim** in the appendix; light cleanup in the post body (fillers removed) is fine, but meaning and words are the customer's. ShareUrls stay in the appendix only — internal links never ship in public copy.
- **The data period is visible** — in the "Where this data comes from" section, not buried.
- **The checkpoint is the one stop.** After it, the next chat output is the deliverable.

## Close

After the deliverable, one sentence offering 2–3 next steps (a LinkedIn-native version of the core insight, the FAQ schema JSON-LD block, a refresh pass in 30–60 days with updated counts). One sentence. No methodology notes.
