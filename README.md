# format-mcp-skills

Ready-made **skills** for using [Format](https://useformat.ai) inside Claude,
ChatGPT, Cursor, and other AI tools — powered by the Format MCP server.

A skill here is a **smart prompt**: a `SKILL.md` whose body is portable markdown
instructions that drive Format's read-only MCP tools to do a concrete job (a
weekly digest, churn signals, a competitor watch, …). MCP standardised the
*tools* layer, but every AI tool has its own idea of a "skill" — so we distribute
the **content**, and let each tool install it its own way.

This repo is surfaced in-app at **Settings → MCP → Use it** (the gallery reads
[`index.json`](#manifest-indexjson)), and as a **Claude Code plugin marketplace**
([`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json)).

> **Note:** these skills are **read-only** and require the Format MCP server to be
> connected: `https://useformat.ai/api/mcp`.

## Install

### Claude Code (one-liner)

```
/plugin marketplace add Format-Technologies/format-mcp-skills
/plugin install format-skills@format-mcp-skills
```

### Everywhere else (copy = install)

Because skills are mostly prompt, the body is portable. Open a skill's `SKILL.md`,
copy the body, and paste it into:

- **ChatGPT** — a Project's / Custom GPT's instructions
- **Cursor** — a `.cursor/rules/*.mdc` rule
- **Microsoft Copilot** — a Copilot Studio agent's instructions
- **Any MCP client** — the prompt, as-is

## Layout

```
.
├── index.json                       ← gallery manifest (the web app reads this)
├── .claude-plugin/
│   └── marketplace.json             ← Claude Code plugin marketplace
└── plugins/
    └── format-skills/               ← the plugin pack (installs as slash-commands)
        ├── .claude-plugin/plugin.json
        ├── README.md
        └── skills/
            └── <skill-id>/
                └── SKILL.md          ← the skill (frontmatter + portable body)
```

## Manifest (`index.json`)

The in-app gallery + persona filter are driven by `index.json` at the repo root.
All skill **metadata** loads upfront; each skill **body** (`bodyPath`) is fetched
lazily when its detail drawer opens.

```jsonc
{
  "version": 1,
  "personas": ["Customer Success", "Sales", "Product", "Marketing", "..."],
  "skills": [
    {
      "id": "weekly-customer-digest",        // unique, kebab-case; matches the skill dir
      "name": "Weekly Customer Digest",       // display name
      "description": "A Monday-morning TL;DR …", // one-liner for the card
      "personas": ["Customer Success"],        // tags; power the catalog filter
      "icon": "Newspaper",                     // lucide-react icon name
      "accent": "#7C3AED",                     // hex; tints the card's icon chip
      "bodyPath": "plugins/format-skills/skills/weekly-customer-digest/SKILL.md"
    }
  ]
}
```

## Adding a skill

1. Create `plugins/format-skills/skills/<skill-id>/SKILL.md` with frontmatter
   (`name`, `description`) and a portable markdown body.
2. Add a matching entry to `index.json` (`id` must equal the skill dir name).
3. Keep `bodyPath` pointing at the new `SKILL.md`.

> `marketplace.json` exposes the whole `format-skills` pack as one plugin, so new
> skills are picked up without editing it. `index.json` is currently
> hand-maintained; generating it from the skill dirs is a future nicety.
