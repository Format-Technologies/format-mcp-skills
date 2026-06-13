---
name: format-sales-call-coaching
description: "Use when assessing the selling competency of one sales rep from their real call recordings in Format. Triggers include: 'coach [rep]', 'score [rep]'s calls', 'how is [rep] selling', 'competency assessment for our AEs', 'sales coaching', 'review call quality', 'where is [rep] losing deals', or 'rep scorecard'. The skill requires a single named rep and a time window — it stops and asks if either is missing — then reads every real conversation that rep had in the window via the Format MCP, classifies each by reachability and motion, scores the genuine prospecting conversations against a behavioural rubric, and produces a competency assessment with verbatim evidence and one prioritised coaching focus. Assessment only — it surfaces evidence and a single priority; it does not write call scripts or run the coaching session."
metadata:
  display_order: 100
  title: Sales Call Coaching
  personas: [sales]
  image: card.jpg
  use_case: >-
    A rep scorecard built from every real call they ran in the window — not
    a sampled highlight reel: each conversation classified, prospecting
    calls scored dimension by dimension with verbatim evidence, and exactly
    one coaching priority, framed Situation–Behaviour–Impact.
  limitations: >-
    One named rep per run, never a team; both rep and window are asked for,
    never defaulted. Reads recorded calls only — it can't see emails,
    in-person meetings, or deals that progressed off-call. The rubric is
    calibrated for short outbound prospecting; the skill detects when the
    rep runs a different motion and says so.
  prompts:
    - "Using the format-sales-call-coaching skill, assess [rep name] over the last 14 days."
    - "Where is [rep name] losing deals? Score their calls since May 1."
---

# Sales Call Coaching

## What this skill does

Given **one named rep** and a time window, this skill reads **every** real conversation that rep had in the window from the Format workspace, scores **all** genuine prospecting conversations (no sampling) against a behavioural rubric calibrated for short outbound prospecting calls, and produces a competency assessment with verbatim evidence and exactly one coaching priority.

It is an **assessment tool, not a coaching session and not a script writer.** The human runs the actual coaching conversation.

## Required inputs — stop and ask, never default

1. **One specific rep name.** This skill assesses exactly one rep per run. If the user doesn't name one ("how are the reps doing?", "score the team"), stop and ask which single rep — never guess, never assess "the team."
2. **A time window** ("last 14 days", "since May 1"). If missing, ask.

Do not pull any records until both are confirmed. One sizing rule at this step: if the window turns out to hold more than ~15 real conversations, finish the count first and propose splitting the window into two runs ("[Rep] had 31 conversations in those 30 days — want me to run the two halves separately so every call still gets a full read?") rather than degrading depth. Splitting preserves the no-sampling principle; silently skimming doesn't.

## Why this rubric is calibrated for short outbound calls

Standard SaaS-discovery rubrics (15–20 discovery questions, talk-ratio targets, MEDDIC multi-threading) assume long video calls with a buying committee. They unfairly fail reps who run short outbound phone calls, where the goal is almost never "close" — it is **earn the next step**. This rubric keeps the behaviours that matter on a short outbound call and drops the volume metrics that don't.

**The skill detects the rep's actual motion before scoring** (Step 4) — if the calls turn out to be scheduled discovery/demo video calls rather than outbound dials, the assessment says so up front in a read-first motion note, presents the scores as directional, and adapts the connect-rate framing to the motion that actually exists. Never fabricate a dial metric for a rep who doesn't dial.

## The run

### Step 1: Confirm inputs

Both mandatory inputs above, confirmed in chat. Then run quietly — the next planned chat output is the assessment.

### Step 2: Resolve the rep (1–2 calls)

`list_records` and read the `persons` array to find the rep's `person.id` (internal participants usually share the company email domain). A name that matches nobody gets flagged and asked about, not guessed.

### Step 3: Pull the complete call list

`list_records` with `personIds: [repId]` and the window. **`dateRange.from`/`to` must be full ISO datetimes** (`2026-05-29T00:00:00Z`, not a bare date). **Paginate to the full `totalCount`** — `list_records` caps at 100 per page; a missing last page is missed conversations, which this skill must never have. Note each record's `insightCount` and data source.

### Step 4: Read and classify every conversation — within a context budget

**Order reads by `insightCount` descending, but read every insight-bearing record — no cap.** `insightCount > 0` reliably marks a real conversation; zero-insight records are usually voicemail/switchboard — count them in the activity table, spot-check borderline short ones.

For each record, `get_record` with insights included. The `content` field is the transcript. **Call duration comes from `media[].duration` (seconds) — convert to `M:SS` for display.** Don't rely on the `context` field for duration or direction; its contents vary by source (on Gong records it often carries the call title).

**Work call-by-call within a context budget.** Transcripts are large and a full window can hold dozens. After reading each call: classify it, score it if eligible, write its complete scorecard row and evidence cells immediately — then drop the transcript and carry only the scorecard forward. Never hold all transcripts simultaneously; never let earlier raw transcripts crowd out the later reads. (Where the environment supports delegating reads to sub-tasks, that's a fine way to parallelize — the contract is that every call gets a full read and an evidenced score, whoever reads it.)

**Classify on two axes before scoring** — a call is scored only if it passes both:

- **Reachability:** *conversation* (real exchange — eligible) vs *non-conversation* (voicemail, switchboard-only, no-answer, sub-~60s with no exchange — counted, not scored; a high non-conversation rate is a list-quality finding, not a rep-skill finding).
- **Motion:** *prospecting* (opening/advancing a new opportunity — scored) vs *deal management* (pricing, procurement, late-stage — flagged, not scored) vs *implementation/post-sale* vs *support* (both flagged, not scored). Never score a non-prospecting call against the prospecting rubric — it produces unfair, meaningless numbers. A rep with zero prospecting calls in the window gets exactly that finding: "[Rep] ran no prospecting calls this window (N deal-management / M support) — nothing to score against this rubric; confirm their role."

**Separate disqualifications from caves.** When a prospecting call ends quickly with no further probing, decide why before scoring:

- ✅ **Correct disqualification** — the prospect is a genuine, structural non-fit (a setup the product can't serve, a committed equivalent solution, a hard ICP miss) and the rep recognised it and exited cleanly. **Good judgement, not failure**: label it ✅, mark Objection handling and Next step **N/A** (excluded from averages, never scored 0), and keep it out of the coaching priority entirely.
- 🔴 **Cave** — the rep abandoned a *viable* opportunity. Timing/budget/political stalls ("budget frozen", "call me next quarter", "new leadership settling in") are **not** disqualifiers — a viable opportunity should be probed and a low-commitment next step attempted. Caving on a stall scores accordingly.

The test: could a competent rep realistically have advanced it? Yes → cave. No → disqualification.

### Step 5: Score each prospecting conversation

Score on the seven dimensions using the behavioural anchors in `references/rubric.md` — **read `references/scoring-example.md` first; it is the gold standard for evidenced scoring.**

| Dimension | Weight | What it scores |
|---|---|---|
| Opening & permission | 10% | Names self/company, earns the right to keep talking |
| Reason-for-call clarity | 10% | States plainly and early why they're calling |
| Discovery / pain | 20% | Uncovers real pain, current process, who decides |
| Value framing | 15% | Ties the offering to *their* stated situation |
| Objection handling | 20% | Acknowledges, explores, reframes — vs caving or steamrolling |
| Next step secured | 20% | A dated meeting or concrete agreed follow-up |
| Call control & register | 5% | Guides the call, professional register |

Evidence cells legible at a glance: *plain point* → `Rep:`/`Prospect:` tagged verbatim quote (gloss only if not self-evident; quotes stay in the call's original language) → for any score below `2/2`, `Missing: [≤5 words]`. Dimension scores always `X/2`; per-call weighted totals always `X.X/2.0`. A dimension with genuinely no opportunity (pure scheduling call) is N/A, excluded from that call's total.

### Step 6: Roll up — summary first

Aggregate across scored prospecting conversations (disqualifications and N/A dimensions excluded). Per-dimension averages, headline weighted average, and the **one coaching priority**: the earliest weak rung on the foundational ladder — openings → discovery → value → objections → next step. Don't coach advanced objection reframing on a rep who isn't getting past the gatekeeper (see `references/coaching-frames.md`).

## Output structure

Lead with the headline; tables and short paragraphs throughout; light emoji signposting (📊 🟢 🔴 🎯 ✅ ⚠️).

```
# 🎯 Sales Call Coaching Assessment — [Rep]
**Window:** [range] · **Org:** [name] · **Rep:** [email]

[Motion note — read first, when the rubric's calibration and the rep's
actual motion differ: what the rep actually runs, what that means for
reading the scores.]

## 📊 1. Activity & headline
| Metric | Count |
[Total records · non-conversations · real conversations · scored ·
✅ correct disqualifications · not-prospecting (by motion) ·
connect rate — labelled for the motion that actually exists.]

**Overall weighted score: X.X/2.0** across [N] scored prospecting
conversations[ · ⚠️ low-confidence — small sample, if N < 8].

[Strengths/weaknesses table: dimension · avg X.X/2.0 · one-line read.]

**🎯 Coaching priority (one thing):** [the earliest weak rung, one short paragraph].

## 🔍 2. Deep dive
[Full per-call scoring sheets for the most instructive calls — strongest,
weakest, clearest pattern examples. Header: company/contact, date, M:SS,
X.X/2.0, source link.]

## 🗂️ 3. Every other conversation (condensed — nothing skipped)
[One row per remaining conversation: contact, date, M:SS, type, score or
N/A, one line, link. Deep-dive set + this table = every conversation.]

## ✅ 4. Disqualifications (for the record, not coached)
[Contact, the verbatim disqualifying line, why it's a genuine non-fit.]

## 🎯 5. Coaching priority, framed SBI
- **Situation:** [call, date, moment] → [link]
- **Behaviour:** "[verbatim quote]" (observable, no adjective)
- **Impact:** [consequence]

## ⚠️ What this misses
[The standing caveat — recorded calls only; no emails, in-person meetings,
or off-call progress; transcription quality varies — a low score on one
call is a prompt to listen, not a verdict; scores reflect call behaviour,
not pipeline outcomes.]
```

## Principles

These are the defaults that make the assessment fair. They're guidance, not law — depart when the situation genuinely calls for it, and say so when you do. Three exceptions stay firm: quotes are never fabricated (and links never invented), the two required inputs are never defaulted, and a correct disqualification is never coached against.

- **Every conversation gets read.** No cap, no sampling, page to the full count — sampling the "best" calls biases the assessment toward the rep's best work. When the window is too big to read honestly, split the window (proposed at Step 1), don't thin the read.
- **Classification decides what's scored.** Both axes, before any scoring; the prospecting rubric never touches a deal-management, implementation, or support call.
- **Every score is substantiated** — evidence cell plus a source link (`sourceUrl` or insight `shareUrl`) per call. A score with no evidence and no link doesn't ship; a link that can't be verified gets dropped, not invented.
- **Quotes are verbatim, in the call's language.** Explanation lives outside the quote marks; a bracketed gloss when the call isn't in the user's language.
- **One coaching priority, framed SBI** — situation, observable behaviour, consequence. No adjectives about the person; overwhelm kills coaching. If the same weakness recurs across reps in separate runs, name it as a team enablement gap rather than repeating it per rep.
- **Assess, don't script.** No call scripts or role-play dialogue unless asked separately.

## How to prompt this skill

```
Using the Format MCP and the format-sales-call-coaching skill, assess [one rep name] over [time window].
```

- *"How are our reps doing on calls?"* → "Which single rep should I assess, and over what window?" — asks for both, never defaults.
- *"Score the outbound team since May 1."* → "This skill assesses one rep at a time. Who first?" Then the single-rep flow, re-run per rep.
