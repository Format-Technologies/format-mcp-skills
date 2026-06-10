---
name: weekly-customer-digest
description: Use when someone asks for a weekly customer digest, a Monday-morning summary of customer conversations, or "what did customers say this week". Produces a concise, quote-backed TL;DR for the team using the Format MCP tools.
---

# Weekly Customer Digest

Produce a short, skimmable digest of what customers said over the past week,
grounded in real quotes from Format. Written for a busy team — lead with what
changed, not raw data.

## When to use

- A recurring Monday-morning summary for the team.
- Anytime someone asks "what happened with customers this/last week?"

## Inputs

- **Time window** — default to the last 7 days unless the user gives a range.
- **Audience** — default to the whole team; adjust tone if told (e.g. an exec
  summary).

## Steps

1. **Set the window.** Resolve the date range (default: the previous 7 days).
2. **Pull the signal.** Use the Format MCP tools to gather what's new in the
   window:
   - `search_insights` for the top themes and notable quotes in the range.
   - `list_records` to see how many conversations happened and with whom.
   - `list_topics` to anchor the digest around the org's tracked topics.

   Prefer insights with strong, specific quotes over vague ones.
3. **Cluster into themes.** Group insights into 3–6 themes. For each, note
   whether it's growing, new, or steady versus prior weeks where that's visible.
4. **Write the digest.** Keep it tight:
   - A one-line **TL;DR** at the top.
   - Per theme: a bold headline, 1–2 sentences, and **one verbatim customer
     quote** with the company/person attribution Format provides.
   - A short **"Worth a look"** list of 2–3 specific follow-ups.
5. **Cite, don't fabricate.** Every claim ties back to an insight or record from
   Format. If the week was quiet, say so plainly rather than padding.

## Output format

```
**Customer digest — {date range}**

TL;DR: {one sentence}

**{Theme headline}**
{1–2 sentences}
> "{customer quote}" — {Person}, {Company}

… (repeat per theme)

**Worth a look**
- {follow-up}
```

## Notes

- Requires the **Format MCP server** to be connected (`https://useformat.ai/api/mcp`).
- Read-only: this skill never writes to or changes anything in Format.
