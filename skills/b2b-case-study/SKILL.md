---
name: b2b-case-study
description: Find your best case study candidates and draft case studies from customer conversation data — before you ever schedule an interview. Use when the user wants to write a case study, customer story, or success story. Also triggers on "case study," "customer story," "who should we feature," "which customer has a good story," "case study draft," "case study candidate," "social proof," "write up a customer win," "we need case studies," "I don't know where to start with case studies," or "turn customer data into a case study." This skill uses customer intelligence data (calls, emails, support tickets, CRM) to identify which customers have the strongest stories and then produces a working draft based on what they've already said — so you walk into the interview with a near-finished piece instead of a blank page. Works best with a customer intelligence platform like Format (MCP server) but also works manually with compiled transcripts and recordings.
metadata:
  title: B2B Case Study
  personas: [marketing]
  image: card.png
  use_case: >-
    Find your strongest case-study candidates from customer conversation data
    and walk into the interview with a near-finished draft — built from what
    customers have already said, instead of starting from a blank page.
  limitations: >-
    Drafts are grounded in existing conversations — final quotes still need
    customer sign-off. Works best with rich call/transcript coverage for the
    featured account.
---

# Case Study Playbook

Your customers are already telling you the case study. Every week, across calls, emails, support tickets, and Slack — they're saying what was broken before, what changed after, and why they'd never go back.

The problem isn't that you don't have the material. It's that nobody is listening for it systematically. So when someone says "we should do a case study," the whole team freezes because they don't know who to ask or what the story even is.

This playbook fixes that. It uses your existing customer conversation data to do two things:

1. **Find the best candidates** — score your customers based on who's already saying case-study-worthy things
2. **Draft the case study** — produce a working first draft before anyone sits down for an interview

By the time you get on a call with the customer, you're not fishing for a story. You're confirming one.

---

## Step 1: Find the Story in Your Data

### With Format MCP (the fast path)

Format synthesizes insights across all your customer conversations — calls, emails, tickets, chat. Use it to surface customers who are already saying the right things.

```
1. Format MCP → list_organizations
   Pull your full customer list.

2. Format MCP → search_insights
   Run searches for case-study signals:

   ROI signals:
   "saved us," "increased by," "cut our," "ROI,"
   "hours per week," "revenue," "reduced," "faster"

   Transformation signals:
   "we used to," "before we had," "now we can,"
   "we finally," "struggled with," "used to take"

   Competitor signals:
   "compared to [competitor]," "switched from,"
   "so much easier than," "when we used [X]"

   Emotional signals:
   "life-saver," "no-brainer," "couldn't live without,"
   "game-changer," "my favorite," "love"

3. Format MCP → get_record
   For your top hits, pull the actual conversation
   snippets with timestamps and full context.

4. Format MCP → list_records
   Check engagement depth — are they active users
   or casual ones? Active users tell better stories.
```

### Without Format (manual path)

Pull transcripts from your call recorder (Gong, Fireflies, Fathom, Granola), export support tickets from Zendesk or Intercom, and search for the same signals above. Talk to CS and Sales: "Who has told you they love the product AND can put a number on it?"

This works — it just takes hours instead of minutes because you're reading through everything yourself.

---

## Step 2: Score Your Candidates

Not every happy customer makes a good case study. Rank your candidates on these:

| Signal | What to look for | Why it matters |
|--------|-----------------|----------------|
| **Clear before/after** | They describe life before your product vs. now | This IS the story — no transformation, no case study |
| **Numbers** | They've mentioned specific metrics, even casually | "Saved 10 hours a week" is proof. "It's been great" is not. |
| **Recognizable or relatable** | Company that your prospects will identify with | Prospects need to see themselves in the story |
| **Articulate champion** | The person talking is specific, quotable, vivid | You can tell from the transcripts if someone speaks well |
| **Competitor displacement** | They switched from something else | "We left X for Y" stories are the most persuasive |
| **Depth of usage** | They use the product regularly and broadly | Casual users give thin stories |

**Output:** A ranked shortlist of 2-3 candidates with notes on what their story likely is, based on what they've already said in real conversations.

---

## Step 3: Build the Pre-Brief

For your top candidate, compile everything you already know into a one-page brief. This is the foundation of your draft.

**Brief structure:**

```
CUSTOMER: [Company name]
CHAMPION: [Name, title — the person who speaks most about you]
INDUSTRY: [Their industry]
STAGE: [Funding, team size, etc.]

BEFORE (what was broken):
- [Pain point 1 — in their words, from conversation data]
- [Pain point 2]
- [What they tried before / competitor they used]

AFTER (what changed):
- [Result 1 — with numbers if they mentioned any]
- [Result 2]
- [How they use the product now]

BEST QUOTES (pulled directly from conversations):
- "[Quote 1]" — [context: which call/email, when]
- "[Quote 2]"
- "[Quote 3]"

GAPS (what you'd still want from an interview):
- [ ] Permission to use their name and company
- [ ] Confirmation of specific metrics
- [ ] The "aha moment" — when they first knew it was working
- [ ] A forward-looking quote about future plans
```

With Format MCP, this takes about 30 minutes. You're pulling real quotes and data, not guessing.

---

## Step 4: Draft the Case Study

Now take the Pre-Brief and write a working first draft. This isn't the final version — it's what you bring to the interview so the customer can react to something real instead of answering cold questions.

### Structure

```
HEADLINE
"How [Company] [achieved specific result] with [Product]"
Must include a number. Always.

HERO METRICS (2-3 stats, big and bold)
Pull from whatever numbers exist in the data.
Flag any that need confirmation in the interview.

PULL QUOTE
The strongest line from the conversation data.
Will likely be replaced or confirmed in the interview.

CHALLENGE
What was broken, why it mattered, what they'd tried before.
2-3 short paragraphs.
Use their actual language from the conversations.
Reader should finish thinking "that's my exact situation."

SOLUTION
How the product addressed the problem.
2-3 sub-sections, each focused on a specific change
in their workflow or outcomes — not a feature list.

RESULTS
Metrics tied back to the challenge.
Include whatever numbers exist, flag what needs confirmation.

COMPANY SIDEBAR
Industry | Stage | HQ | Team size
```

### Headline formulas

- "How [Company] [achieved result] with [Product]"
- "How [Company] [verbed] [metric] in [timeframe]"
- "[Company] [verbs] [outcome] with [Product]"

### Voice

Write like a journalist covering a business, not a marketer pitching a product. Customer quotes carry the narrative. Specific numbers, named tools, and real details build credibility.

**Test:** If a sentence could appear in any competitor's case study unchanged, rewrite it.

> For detailed section-by-section writing guidance, headline formulas, quote placement, and voice rules, read `references/writing-guide.md`

---

## Step 5: Use the Draft

You now have a working case study before you've even talked to the customer. Here's what to do with it:

**Walk into the interview prepared.** You're not asking "so, what do you like about us?" You're saying "you mentioned [specific thing] — can you tell me more about that?" The interview becomes a 20-minute confirmation instead of a 45-minute fishing expedition.

**Let the customer react to a draft.** Some customers respond better when they see something concrete. "Here's what we've put together from our conversations — does this feel right?" is easier for them than "tell us your story from scratch."

**Ship faster.** After the interview, you're plugging in confirmed quotes and updated metrics — not starting from scratch. Draft-to-final takes hours, not weeks.

---

## After the Interview: Ship and Repurpose

Once you've confirmed the story and gotten approval, one case study should become multiple assets.

> For the full repurposing playbook with templates, read `references/repurposing-guide.md`

**Minimum output from one case study:**

| Asset | Where it goes |
|-------|--------------|
| Full case study (web page) | Website |
| One-pager PDF | Sales follow-ups |
| Proof slide | Sales deck |
| 3-5 LinkedIn posts | Organic social |
| Quote snippet | Cold outreach emails |

**Measure what matters:** Win rate of deals where the case study was shared. How often reps mention this customer on calls. Pipeline influence. Not page views.

---

## Why This Works

The traditional process starts with a blank page and hopes the interview fills it.

This process starts with evidence. Your customers have been telling you the story for months — in QBRs, support tickets, renewal calls, and casual check-ins. The skill is hearing it systematically, pulling the best material together, and walking into the interview with 80% of the work already done.

With Format, the discovery and briefing takes about 30 minutes total. Without it, you can do the same thing by compiling transcripts manually — it just takes longer.

Either way: data first, interview second, draft before you ask.

---

## Reference Files

- **`references/writing-guide.md`** — Section-by-section writing template, voice guidelines, headline formulas, quote placement, and how to handle limited or sensitive metrics.

- **`references/repurposing-guide.md`** — How to turn one case study into 10+ assets. Templates for one-pagers, sales slides, LinkedIn posts, cold outreach snippets, and a distribution sequence.
