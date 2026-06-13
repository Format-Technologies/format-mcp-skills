# Worked Scoring Example (gold standard)

This is the reference for **what a fully-substantiated scored call looks like.** Every run must match this standard: a per-dimension table, a source link in the card header, and evidence cells written so the reader grasps the score at a glance.

> The example below is **illustrative** (synthetic account and quotes) to show the *format*. In a real run, every quote is verbatim from the transcript and every link is a real `sourceUrl` / insight `shareUrl`.

## Evidence-cell formula (read this — it is the point of the example)

Each evidence cell must be legible at a glance. Don't lean on the quote to carry the meaning. Build every cell in this order:

1. **Plain-language point first** — the opening words say what the rep did. The quote is *proof*, not the explanation.
2. **Tag the speaker** — `Rep:` or `Prospect:` before every quote. Never leave it ambiguous who spoke.
3. **Short verbatim quote** — add a 3–6 word gloss in brackets only when the quote isn't self-evident (e.g. the call is in another language).
4. **`Missing: [≤5 words]`** at the end of any cell scored below `2/2` — the single thing that would have raised it. Omit on a clean `2/2`.

Cell shape: *Plain point. Speaker: "short quote" (gloss if needed). Missing: [≤5 words].*

Keep cells short. One quote per speaker per cell is usually enough; the `Missing:` note is the coaching takeaway, written for the reader.

## How to cite evidence

Every record from `get_record` carries source links:

- **Call source** — the `sourceUrl` field (the dialer/recording link, e.g. an Aircall or Fathom URL).
- **Insight source** — each insight in the `insights` array has a `shareUrl` (`https://useformat.ai/share/insight/{id}`). Prefer this when the evidence is a Format-extracted insight; it deep-links to the exact moment and topic.

Put the **call source link in the card header** (one per call), and drop an insight `shareUrl` inline only on the specific cell it substantiates. Quote **verbatim**, never paraphrased. The plain-language reading goes outside the quotes.

---

## Worked example (illustrative) — [Rep] / [Prospect account, contact]
**Date:** [date] · **Duration:** 9:49 · **Direction:** outbound
**Call source:** [sourceUrl]
**Call type:** Prospecting (re-engagement of a lead first contacted earlier in the year) · **Reachability:** Conversation (got through the switchboard to the named contact)

### Per-dimension scoring

| Dimension | Wt | Score | Evidence |
|---|---|---|---|
| Opening & permission | 10% | `2/2` | Cleared the switchboard by name and reason, then re-anchored the prior contact. Rep: *"Could you put me through to [contact]? We spoke earlier this year."* |
| Reason-for-call clarity | 10% | `2/2` | Said why he was calling in the first turn. Rep: *"I'm calling back to see whether the changes you made brought the error rate down."* |
| Discovery / pain | 20% | `2/2` | Probed with a number and surfaced the decision driver. Rep: *"Where are you on error rate now? You were at 23%."* Prospect: *"We have a target to get under 20% by 2030"* (a mandate priority). → [insight shareUrl] |
| Value framing | 15% | `2/2` | Tied the product to her exact setup with cross-customer proof. Rep: *"Given your setup, the part that matters is [capability] — it's what moved the needle for [comparable account]."* |
| Objection handling | 20% | `1/2` | Took two brush-offs at face value. Prospect: *"We might look at it for the next contract cycle… not before 2030."* → Rep: *"Understood, no problem"* (pivoted without testing the date). Missing: a "what would change that?" probe. |
| Next step secured | 20% | `1/2` | Pitched a 30-min meeting well but let it close undated. Prospect: *"Just send me something to read."* → Rep accepted. Missing: a dated commitment. |
| Call control & register | 5% | `2/2` | Steered start to finish, warm register, never pushy. |

**Weighted score: (0.10×2 + 0.10×2 + 0.20×2 + 0.15×2 + 0.20×1 + 0.20×1 + 0.05×2) = `1.60/2.0`**

### Reading
Strong discovery, value framing, and control — a genuinely good prospecting call. The ceiling is objection handling → next-step conversion: when a real objection lands (timing, "next contract cycle"), the rep acknowledges and pivots instead of probing what would actually change the picture, and lets the next step close undated. Note the buying signal surfaced but not converted: she named a concrete future trigger (a contract renewal with performance targets). A score-2 version of this call books a dated follow-up tied to that trigger, or at minimum agrees a specific date to send tailored benchmarks and review them together.

**Coaching priority:** objection handling → next-step conversion. One behaviour, two dimensions: turn "understood, no problem" into "what would need to be true for this to move?" and convert the answer into a dated commitment.

---

## Source-link rules for the skill
- Put the **call `sourceUrl`** in the card header for every scored call so the user can open the recording.
- When a specific cell rests on a Format insight, drop its **`shareUrl`** inline on that cell — it deep-links to the moment and shows the topic tag.
- Every evidence cell follows the formula: plain-language point first, speaker tag on every quote, short verbatim quote (+ gloss if needed), and `Missing: [≤5 words]` on anything below `2/2`.
- Never fabricate a link. If a record has no `sourceUrl`, write "(no source link on this record)".
- A routine `2/2` (clean opening, good register) can stand on the plain-language point alone; any `0/2` or `1/2` MUST carry a specific verbatim quote showing why, plus its `Missing:` note.
