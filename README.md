# Format Skills

Ready-made skills for using [Format](https://useformat.ai) — your customer
conversations, queryable from any AI tool — inside Claude, ChatGPT, Cursor,
and anything else that speaks MCP.

Each skill is a portable prompt (`SKILL.md`) that drives Format's read-only
MCP tools to do a real job: brief you on your accounts, define your ICP from
what customers actually said, draft a case study before the interview.

## The skills

| Skill | For | What it does |
|---|---|---|
| [`cs-account-briefing`](skills/cs-account-briefing/SKILL.md) | Customer Success | Scan your book of business for risk, blocker, adoption, relationship, growth and commercial signals — per account, with verbatim evidence. Built for weekly briefs and QBR prep. |
| [`defining-your-icp`](skills/defining-your-icp/SKILL.md) | Marketing · Sales · Leadership | Build an evidence-backed Ideal Customer Profile from real customer conversations — snapshot, personas, in-market language, target-account criteria. |
| [`b2b-case-study`](skills/b2b-case-study/SKILL.md) | Marketing | Find your strongest case-study candidates and walk into the interview with a near-finished draft, built from what customers already said. |

More skills land regularly — browse them with previews in the Format app
under **Settings → MCP → Use it**.

## Before you start

Every skill needs the **Format MCP server** connected to your AI tool:
`https://useformat.ai/api/mcp`. Setup guides for Claude, ChatGPT, Cursor and
Microsoft Copilot: **[useformat.ai/mcp](https://useformat.ai/mcp)**.

All skills are read-only — they query your Format workspace and never change
anything in it.

## Install

### Claude Code

```
/plugin marketplace add Format-Technologies/format-mcp-skills    # once
/plugin install <skill-id>@format-mcp-skills                     # per skill
```

Each skill is its own plugin — install only what you want. Updates arrive
with `/plugin update`.

### claude.ai

Zip a skill's folder (e.g. `skills/defining-your-icp/`) and upload it at
**Settings → Capabilities → Skills** — or grab the ready-made download from
the Format app's skill gallery.

### ChatGPT, Cursor, Copilot, and everything else

Skills are mostly prompt, so the content travels: open the skill's
`SKILL.md`, copy everything below the frontmatter, and paste it into a
ChatGPT Project's instructions, a `.cursor/rules/*.mdc` file, a Copilot
Studio agent — or just into the chat.

## Contributing

Want to improve a skill or understand how this repo is put together? See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

The contents of **this repository** — the skill files and the tooling around
them — are [MIT licensed](LICENSE): copy, adapt, and use them freely.

The license covers this repository only. It does **not** apply to anything
else Format-related: the Format product, the Format MCP server and its APIs,
Format's trademarks and brand, and any data accessed through a Format
workspace are not licensed here and remain governed by your agreement with
Format.
