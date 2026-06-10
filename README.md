# format-mcp-skills

Ready-made **skills** for using [Format](https://useformat.ai) inside Claude,
ChatGPT, Cursor, and other AI tools — powered by the Format MCP server.

A skill is a **smart prompt**: a `SKILL.md` whose body is portable markdown
instructions that drive Format's read-only MCP tools to do a concrete job —
a CS account briefing, an evidence-backed ICP, a case-study draft. MCP
standardised the *tools* layer, but every AI tool has its own idea of a
"skill" — so this repo distributes the **content**, and each tool installs it
its own way.

This repo is surfaced in-app at **Settings → MCP → Use it** (the gallery reads
`index.json`), and doubles as a **Claude Code plugin marketplace**.

> These skills require the Format MCP server to be connected:
> `https://useformat.ai/api/mcp` — see [useformat.ai/mcp](https://useformat.ai/mcp).

## Install

### Claude Code

```
/plugin marketplace add Format-Technologies/format-mcp-skills    # once
/plugin install <skill-id>@format-mcp-skills                     # per skill
```

Each skill is its own plugin — install only what you want. Updates flow
automatically on every commit (`/plugin update`).

### claude.ai

Download the skill's zip from the in-app gallery (Settings → MCP → Use it),
then upload it at **Settings → Capabilities → Skills**. (Or zip a
`skills/<id>/` folder from this repo yourself.)

### Everywhere else (copy = install)

Skills are mostly prompt, so the body travels. Open the skill's `SKILL.md`,
copy everything below the frontmatter, and paste it into:

- **ChatGPT** — a Project's / Custom GPT's instructions
- **Cursor** — a `.cursor/rules/*.mdc` rule
- **Microsoft Copilot** — a Copilot Studio agent's instructions
- **Any MCP client** — the prompt, as-is

## Repo layout

```
.
├── skills/                          ← the only thing maintainers touch
│   └── <skill-id>/
│       ├── SKILL.md                 ← single source of truth (frontmatter + body)
│       ├── card.png                 ← gallery image (not part of the install)
│       └── references/…             ← optional supporting files (installed with the skill)
├── index.json                       ← GENERATED — gallery manifest (the app reads this)
├── .claude-plugin/marketplace.json  ← GENERATED — one plugin per skill
└── scripts/generate.mjs             ← frontmatter → both manifests
```

**Never edit `index.json` or `marketplace.json` by hand** — they are generated
from `SKILL.md` frontmatter. CI rejects PRs where they're out of sync.

## Adding a skill

1. Create `skills/<skill-id>/SKILL.md`:

   ```yaml
   ---
   name: <skill-id>                  # must equal the directory name; kebab-case
   description: >                    # Claude's trigger description — when to invoke
     Use when …
   metadata:                         # gallery fields (the app's cards + drawer)
     title: Display Name
     personas: [marketing, sales]    # known set — see PERSONAS in scripts/generate.mjs
     image: card.png
     use_case: >-
       What it's for, in customer language.
     limitations: >-
       What it won't do / what it needs.
   ---
   <body — written for Claude, generic enough to paste into any tool>
   ```

2. Add a `card.png` (and any `references/` the skill needs).
3. Run `npm run generate`, commit everything, open a PR.

CI validates the frontmatter (schema, id-matches-dir, image exists, known
personas) and that the generated manifests are in sync — a malformed skill
cannot merge. Merging to `main` is publishing: the app gallery and Claude Code
marketplace both read `main`.

## The manifest contract (`index.json`)

What the in-app gallery consumes. Metadata for all skills loads upfront; each
skill's body (`bodyPath`) is fetched lazily when its detail drawer opens;
`files` lists everything the install zip should contain.

```jsonc
{
  "version": 1,
  "personas": ["customer-success", "marketing", "..."],   // union across skills
  "skills": [
    {
      "id": "defining-your-icp",
      "title": "Define Your ICP",
      "description": "<Claude trigger description>",
      "personas": ["marketing", "sales", "leadership"],
      "image": "skills/defining-your-icp/card.png",
      "useCase": "<card + drawer copy>",
      "limitations": "<drawer copy>",
      "bodyPath": "skills/defining-your-icp/SKILL.md",
      "files": ["skills/defining-your-icp/SKILL.md"]      // contents of the install zip
    }
  ]
}
```

Design rationale, decisions, and diagrams live in the Format workstream doc
(`format` repo → `docs/plans/2026-06-10-format-2045-skills-repo-architecture.md`).
