# CLAUDE.md

Public skills library for the Format MCP server. Consumed by the Format app's
skill gallery (via `index.v1.json`, the frozen-shape twin of `index.json`) and by Claude Code as a plugin marketplace.
Full contract and authoring guide: [CONTRIBUTING.md](CONTRIBUTING.md).

## Hard rules

1. **Never hand-edit `index.json`, `index.v1.json`, or `.claude-plugin/marketplace.json`** —
   both are generated from `SKILL.md` frontmatter.
2. **After any change under `skills/`, run `npm run generate`** and commit the
   regenerated manifests with it. `npm run check` must pass before pushing.
3. **One folder per skill** — `skills/<id>/SKILL.md`, where `id` is kebab-case
   and equals the frontmatter `name`. Persona names are reserved (validator
   enforces this).
4. **Verify every Format MCP tool call** in a skill body against the real tool
   schemas before committing — never write plausible-looking parameters from
   memory.
5. **This repo is public.** No customer names, internal links, ticket
   references, or strategy notes — in any file, including this one.
6. **Merging to `main` is publishing** — the app gallery and Claude Code
   installs update from `main` directly. There is no staging branch.
