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
├── orgs/
│   ├── index.v1.json                ← GENERATED — org-scoped skills manifest
│   └── <org-slug>/
│       ├── org.json                 ← binds the folder to a Format org id
│       └── <skill-id>/…             ← an org skill: same shape as a generic skill folder
├── index.json                       ← GENERATED — gallery manifest
├── index.v1.json                    ← GENERATED — frozen v1 twin (the Format app reads this)
├── .claude-plugin/marketplace.json  ← GENERATED — Claude Code marketplace, one plugin per skill
└── scripts/generate.mjs             ← frontmatter → all manifests; also the CI validator
```

**Never edit `index.json`, `index.v1.json`, `orgs/index.v1.json`, or
`.claude-plugin/marketplace.json` by hand.** They are derived from `SKILL.md`
frontmatter; CI rejects PRs where they're out of sync with the skills.

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
     related: [other-skill-id] # optional — companion skills this one hands off to
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
- Every id in `metadata.related` must name a skill that exists in this repo
  (and not the skill itself) — cross-skill references are a checked contract,
  so renaming or removing a skill breaks CI until references are updated. A
  skill body that names a related skill must still degrade gracefully when
  that skill isn't installed (suggest it if available; otherwise do the work
  inline and point at the gallery).

## Org-scoped skills (`orgs/`)

Some customers get bespoke skills served only to their Format organization,
alongside the generic catalogue. The layout mirrors `skills/`:

```
orgs/<org-slug>/org.json        ← { "orgId": "<Format org id>" } — the binding
orgs/<org-slug>/<skill-id>/…    ← one folder per skill, exactly like skills/<id>/
```

- **`org.json` is mandatory** and holds exactly one key: a non-empty string
  `orgId`. The folder name is the org's slug — kebab-case, like skill ids.
- **Org skills follow every generic-skill rule** (frontmatter fields, kebab
  ids, reserved ids, description length, image, …) and are validated by the
  same generator. Within one org, skill ids are unique; `metadata.related` may
  reference generic skills or siblings in the same org.
- **Location is the only scope authority.** Nothing in a skill's frontmatter
  says which org it belongs to — the generator rejects any org-ish frontmatter
  key so scope is never declared in two places.
- **Same id as a generic skill = override.** An org skill whose id matches a
  generic skill replaces the generic one for that org (the app serves the org
  version to that org, the generic version to everyone else). Any other id is
  a net-new skill visible only to that org.
- **Generated output: `orgs/index.v1.json`.** Entries use the exact same shape
  as `index.v1.json` skill entries (including `frontmatter` and per-file
  `resources` digests), with repo-relative paths under `orgs/<slug>/…`. Same
  freeze discipline: additive-only under version 1; a breaking change ships as
  `orgs/index.v2.json`. The file exists even with no org folders (empty map).
- **The purity invariant:** org additions must never perturb the generic
  manifests — `index.json`, `index.v1.json`, and
  `.claude-plugin/marketplace.json` stay byte-identical whatever happens under
  `orgs/`. Org skills never appear in the Claude Code marketplace.
- **Offboarding is deletion.** Removing `orgs/<slug>/` (and regenerating)
  fully offboards an org — no other file references it.

## Writing guidelines

- **Accuracy over plausibility:** every Format MCP tool call in a skill body
  must use real tool names and real parameters. If you're not sure a
  parameter exists, check it against the live `tools/list` schema — the
  server's schemas are strict, so an unrecognised key now **fails the call by
  name** instead of being silently dropped. A skill that references invented
  API surface no longer degrades quietly; it breaks loudly for everyone who
  installs it.
- **Use the tool that is the altitude.** There is no level or select dial.
  `search_insight_groups` returns themes across customers,
  `search_insights` returns what one person said, and
  `search_insights({ supportingGroupId })` drills from one to the other.
  `describe_org` is the single orientation call.
- **Speak the surface's vocabulary:** *insight* and *insight group*, never
  quote, answer, level, aggregated or lens. A field name is the only
  documentation most callers read, and a skill teaching a synonym teaches a
  word nothing else uses.
- **Portable by default:** the body should work pasted into any AI tool.
  Environment-specific machinery (file outputs, UI affordances) must be
  phrased conditionally ("on claude.ai…; in Claude Code…").
- **Reading is the default; writing is asked for.** Skills query Format. The
  only writes any skill may perform are creating and publishing a **new**
  report the user explicitly asked for (`create_report` and friends, which are
  gated per organization) — never editing or deleting anything already in the
  workspace, and never without showing the user first. A skill that offers a
  report destination must degrade gracefully when those tools aren't on the
  connection.
- **Public content only:** no customer names, no internal links, nothing you
  wouldn't put on the website.

## How releases work

There are none — merging to `main` is publishing. The Format app's gallery
reads `index.v1.json` from `main` (~5-minute cache), and Claude Code treats each
new commit as an update.
