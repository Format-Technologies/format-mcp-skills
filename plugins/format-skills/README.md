# format-skills

Ready-made **customer-intelligence skills** powered by the [Format](https://useformat.ai)
MCP server. Each skill is a portable "smart prompt" (`SKILL.md`) that drives
Format's read-only MCP tools to do a real job — a weekly digest, churn signals,
a competitor watch, and more.

These skills require the Format MCP server to be connected
(`https://useformat.ai/api/mcp`). They are **read-only** — they never write to or
change anything in Format.

## Install (Claude Code)

```
/plugin marketplace add Format-Technologies/format-mcp-skills
/plugin install format-skills@format-mcp-skills
```

## Use anywhere else

Every skill is "mostly prompt", so the body travels. Open a skill's `SKILL.md`,
copy the body, and paste it into your tool of choice (a ChatGPT Project, a Cursor
rule, a Copilot Studio agent, etc.). Copy = install.

## Skills

| Skill | Persona | What it does |
|---|---|---|
| `weekly-customer-digest` | Customer Success | A Monday-morning TL;DR of every conversation, written for your team. |

_More skills are seeded over time — see the repo root `index.json` for the live set._
