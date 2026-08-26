# CLAUDE.md

Public skills library for the Format MCP server. Consumed by the Format app's
skill gallery (via `index.v1.json`, the frozen-shape twin of `index.json`) and by Claude Code as a plugin marketplace.
Full contract and authoring guide: [CONTRIBUTING.md](CONTRIBUTING.md).

## Hard rules

1. **Never hand-edit `index.json`, `index.v1.json`, `orgs/index.v1.json`, or
   `.claude-plugin/marketplace.json`** — all are generated from `SKILL.md`
   frontmatter.
2. **After any change under `skills/` or `orgs/`, run `npm run generate`** and
   commit the regenerated manifests with it. `npm run check` must pass before
   pushing. Changes under `orgs/` must leave `index.json`, `index.v1.json`,
   and `.claude-plugin/marketplace.json` byte-identical (org skills live only
   in `orgs/index.v1.json` and never in the marketplace) — see
   [CONTRIBUTING.md](CONTRIBUTING.md) → "Org-scoped skills".
3. **One folder per skill** — `skills/<id>/SKILL.md`, where `id` is kebab-case
   and equals the frontmatter `name`. Persona names are reserved (validator
   enforces this).
4. **Verify every Format MCP tool call** in a skill body against the real tool
   schemas before committing — never write plausible-looking parameters from
   memory. The schemas are strict: an unrecognised parameter fails the call
   and names the key, so an invented one breaks the skill outright rather than
   being ignored.
5. **This repo is public.** No internal links, ticket references, or strategy
   notes — in any file, including this one. Customer names appear only where
   the org-scoped design requires them (`orgs/<slug>/` and its skills); even
   there, nothing confidential — no customer data, metrics, or internal
   process details beyond what the customer has agreed to keep in a public
   skill. Commit messages and branch names are public too — same rule.
   **Worked examples in a skill body are invented**, never real output with
   the names taken out: the shape survives anonymising, the data doesn't.
6. **Merging to `main` is publishing** — the app gallery and Claude Code
   installs update from `main` directly. There is no staging branch.
