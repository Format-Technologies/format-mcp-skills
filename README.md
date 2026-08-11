# Format Skills

Ready-made skills for using [Format](https://useformat.ai) — your customer
conversations, queryable from any AI tool — inside Claude, ChatGPT, Cursor,
and anything else that speaks MCP.

Each skill is a portable prompt (`SKILL.md`) that drives Format's MCP tools to
do a real job: brief you on your accounts, define your ICP from what customers
actually said, draft a case study before the interview.

## The skills

| Skill | For | What it does |
|---|---|---|
| [`format-company-context`](skills/format-company-context/SKILL.md) | Everyone | Distil what customers actually say into one shared context document your team's AI works from — positioning, ICP, personas, pain points, brand voice, proof points. |
| [`format-ticket-research`](skills/format-ticket-research/SKILL.md) | Product | Ground one ticket in customer reality before you build it: each distinct ask in customers' own words, who raised it and when, every piece of evidence linked. |
| [`format-roadmap-check`](skills/format-roadmap-check/SKILL.md) | Product · Leadership | Hold a roadmap up against what customers have said — an evidence board per item, plus the demand that maps to nothing you're building. |
| [`format-account-briefing`](skills/format-account-briefing/SKILL.md) | Customer Success | Scan your book of business for risk, blocker, adoption, relationship, growth and commercial signals — per account, with verbatim evidence. Built for weekly briefs and QBR prep. |
| [`format-case-study`](skills/format-case-study/SKILL.md) | Marketing | Find your strongest case-study candidates and walk into the interview with a near-finished draft, built from what customers already said. |
| [`format-icp-definition`](skills/format-icp-definition/SKILL.md) | Marketing · Sales · Leadership | Build an evidence-backed Ideal Customer Profile from real customer conversations — snapshot, personas, in-market language, target-account criteria. |
| [`format-ads-copy`](skills/format-ads-copy/SKILL.md) | Marketing | Paid ad copy that sounds like your customers because it is built from them — angles anchored to real evidence, spec-compliant for LinkedIn, Google RSA and Lead Gen Forms. |
| [`format-sales-enablement`](skills/format-sales-enablement/SKILL.md) | Sales | Decks, one-pagers, objection docs, demo scripts, battlecards and persona cards — grounded in the objections and proof points your own deals actually contain. |
| [`format-blog-post`](skills/format-blog-post/SKILL.md) | Marketing | Posts that answer engines cite, because they carry something no model can fabricate: your customers' real words and honestly counted data. |
| [`format-sales-call-coaching`](skills/format-sales-call-coaching/SKILL.md) | Sales | A rep scorecard built from every real call they ran in the window — each conversation classified, prospecting calls scored with verbatim evidence, one coaching priority. |

More skills land regularly — browse them with previews in the Format app
under **Settings → MCP**.

## Before you start

Every skill needs the **Format MCP server** connected to your AI tool:
`https://useformat.ai/api/mcp`. Setup guides for Claude, ChatGPT, Cursor and
Microsoft Copilot: **[useformat.ai/mcp](https://useformat.ai/mcp)**.

Skills read your Format workspace; they don't change it. The one exception is
the report destination a couple of the research skills offer, which publishes
a **new** report into Format when you ask for one, and never edits or deletes
anything that was already there. Report authoring is enabled per organization,
so those write tools may not be on your connection at all; when they aren't, a
skill says so and delivers the work another way.

## Install

### Claude Code

Run these one at a time — pasting both lines at once submits them as a
single command, which fails with a confusing SSH error.

Add the marketplace (once):

```
/plugin marketplace add Format-Technologies/format-mcp-skills
```

Then install any skill:

```
/plugin install <skill-id>@format-mcp-skills
```

Each skill is its own plugin — install only what you want. Updates arrive
with `/plugin update`.

### claude.ai

Zip a skill's folder (e.g. `skills/format-icp-definition/`) and upload it at
**Settings → Capabilities → Skills** — or grab the ready-made download from
the Format app's skill gallery.

### ChatGPT, Cursor, Copilot, and everything else

Skills are mostly prompt, so the content travels: open the skill's
`SKILL.md`, copy everything below the frontmatter, and paste it into a
ChatGPT Project's instructions, a `.cursor/rules/*.mdc` file, a Copilot
Studio agent — or just into the chat.

## Contributing

Want to improve a skill or understand how this repo is put together? See
[CONTRIBUTING.md](CONTRIBUTING.md). Besides the generic catalogue above, the
repo also carries **org-scoped skills** under `orgs/` — bespoke versions
served only to a specific Format organization; the layout and rules are in
CONTRIBUTING.md → "Org-scoped skills".

## License

The contents of **this repository** — the skill files and the tooling around
them — are [MIT licensed](LICENSE): copy, adapt, and use them freely.

The license covers this repository only. It does **not** apply to anything
else Format-related: the Format product, the Format MCP server and its APIs,
Format's trademarks and brand, and any data accessed through a Format
workspace are not licensed here and remain governed by your agreement with
Format.
