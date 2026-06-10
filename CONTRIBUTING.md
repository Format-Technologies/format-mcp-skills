# Contributing

This repo has one rule that explains everything else: **a skill is one folder,
and everything else is generated from it.**

## Repo layout

```
.
├── skills/
│   └── <skill-id>/
│       ├── SKILL.md                 ← the skill: frontmatter (metadata) + body (the prompt)
│       ├── card.png                 ← gallery image (display only, not part of the install)
│       └── references/…             ← optional supporting files, installed with the skill
├── index.json                       ← GENERATED — gallery manifest
├── index.v1.json                    ← GENERATED — frozen v1 twin (the Format app reads this)
├── .claude-plugin/marketplace.json  ← GENERATED — Claude Code marketplace, one plugin per skill
└── scripts/generate.mjs             ← frontmatter → both manifests; also the CI validator
```

**Never edit `index.json`, `index.v1.json`, or `.claude-plugin/marketplace.json` by hand.** They
are derived from `SKILL.md` frontmatter; CI rejects PRs where they're out of
sync with the skills.

## Adding or changing a skill

1. Create or edit `skills/<skill-id>/SKILL.md`:

   ```yaml
   ---
   name: <skill-id>            # must equal the directory name; kebab-case
   description: >              # the trigger description — when an AI tool should invoke this
     Use when …
   metadata:                   # powers the Format app's gallery
     title: Display Name
     personas: [marketing]     # one or more of the known personas (see scripts/generate.mjs)
     image: card.png
     use_case: >-
       What it's for, in customer language.
     limitations: >-
       What it won't do / what it needs.
     prompts:                  # optional — example prompts shown with the skill
       - "Example prompt a user could paste."
   ---
   <body — the prompt itself. Written for Claude first, but portable: it gets
   pasted into ChatGPT Projects, Cursor rules, and Copilot agents as-is.>
   ```

2. Add a `card.png` and any `references/` files the body points to.
3. Run `npm run generate` and commit everything (skill + regenerated manifests).
4. Open a PR. CI runs `npm run check` — the PR can't merge if validation
   fails or the manifests are stale.

## Rules the validator enforces

- `name` equals the directory name, kebab-case.
- `metadata.title`, `use_case`, `limitations`, `image` (existing file), and at
  least one known persona are required.
- Skill ids may not be persona names (`marketing`, `sales`, …) — those are
  reserved for future persona-pack plugins.

## Writing guidelines

- **Accuracy over plausibility:** every Format MCP tool call in a skill body
  must use real tool names and real parameters. If you're not sure a
  parameter exists, check — a skill that references invented API surface
  fails confusingly for everyone who installs it.
- **Portable by default:** the body should work pasted into any AI tool.
  Environment-specific machinery (file outputs, UI affordances) must be
  phrased conditionally ("on claude.ai…; in Claude Code…").
- **Read-only:** skills query Format; they never instruct the model to
  modify anything in it.
- **Public content only:** no customer names, no internal links, nothing you
  wouldn't put on the website.

## How releases work

There are none — merging to `main` is publishing. The Format app's gallery
reads `index.v1.json` from `main` (~5-minute cache), and Claude Code treats each
new commit as an update.
