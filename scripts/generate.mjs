// Generates index.json (gallery manifest) and .claude-plugin/marketplace.json
// from the SKILL.md frontmatter of every skill under skills/.
//
// SKILL.md frontmatter is the single source of truth — never edit the
// generated files by hand. See README.md for the contract.
//
// Usage:
//   node scripts/generate.mjs           # write both files
//   node scripts/generate.mjs --check   # exit 1 if files are out of sync (CI PR gate)

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKILLS_DIR = join(ROOT, 'skills');
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Known personas — extend deliberately, the app's filter chips mirror this. */
const PERSONAS = [
  'customer-success',
  'sales',
  'marketing',
  'product',
  'leadership',
  'research',
];

/**
 * Names a skill may never claim: persona ids are reserved for future
 * persona-pack plugins (e.g. a "marketing" plugin installing all marketing
 * skills at once), and "all" is the catalog's unfiltered view.
 */
const RESERVED_IDS = [...PERSONAS, 'all', ...PERSONAS.map((p) => `${p}-pack`)];

const errors = [];
const fail = (skill, msg) => errors.push(`  ${skill}: ${msg}`);

function parseFrontmatter(raw, skill) {
  // \r?\n: tolerate CRLF working trees (Windows contributors, autocrlf).
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) {
    fail(skill, 'SKILL.md has no frontmatter block');
    return null;
  }
  try {
    return yaml.load(m[1]);
  } catch (e) {
    fail(skill, `frontmatter is not valid YAML: ${e.message}`);
    return null;
  }
}

/** Every file in the skill dir except the card image — what the install zip contains. */
function listFiles(dir, imageRepoPath) {
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      // Manifest paths are always POSIX, whatever OS generated them.
      else out.push(relative(ROOT, p).split(sep).join('/'));
    }
  };
  walk(dir);
  // Exact-path comparison — a basename match would also drop legitimate
  // nested assets that happen to share the card image's filename.
  return out.filter((p) => p !== imageRepoPath).sort();
}

function loadSkill(id) {
  const dir = join(SKILLS_DIR, id);
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    fail(id, 'missing SKILL.md');
    return null;
  }
  const fm = parseFrontmatter(readFileSync(skillMd, 'utf8'), id);
  if (!fm) return null;

  if (fm.name !== id) fail(id, `frontmatter name "${fm.name}" != directory name`);
  if (!KEBAB.test(id)) fail(id, 'directory name must be kebab-case');
  if (RESERVED_IDS.includes(id)) {
    fail(id, `"${id}" is reserved for persona packs — pick another id`);
  }
  if (!fm.description?.trim()) fail(id, 'missing description');

  const meta = fm.metadata ?? {};
  if (!meta.title?.trim()) fail(id, 'missing metadata.title');
  if (!meta.use_case?.trim()) fail(id, 'missing metadata.use_case');
  if (!meta.limitations?.trim()) fail(id, 'missing metadata.limitations');
  if (!Array.isArray(meta.personas) || meta.personas.length === 0) {
    fail(id, 'metadata.personas must be a non-empty array');
  } else {
    for (const p of meta.personas) {
      if (!PERSONAS.includes(p)) {
        fail(id, `unknown persona "${p}" (known: ${PERSONAS.join(', ')})`);
      }
    }
  }
  if (!meta.image?.trim()) fail(id, 'missing metadata.image');
  else if (!existsSync(join(dir, meta.image))) fail(id, `image "${meta.image}" not found`);
  if (
    meta.prompts !== undefined &&
    (!Array.isArray(meta.prompts) ||
      meta.prompts.length === 0 ||
      meta.prompts.some((p) => typeof p !== 'string' || !p.trim()))
  ) {
    fail(id, 'metadata.prompts must be a non-empty array of strings when present');
  }
  if (
    meta.related !== undefined &&
    (!Array.isArray(meta.related) ||
      meta.related.length === 0 ||
      meta.related.some((r) => typeof r !== 'string' || !r.trim()))
  ) {
    fail(id, 'metadata.related must be a non-empty array of skill ids when present');
  }
  if (
    meta.display_order !== undefined &&
    (!Number.isInteger(meta.display_order) || meta.display_order < 0)
  ) {
    fail(id, 'metadata.display_order must be a non-negative integer when present');
  }

  return {
    id,
    title: meta.title,
    description: fm.description,
    personas: meta.personas ?? [],
    image: `skills/${id}/${meta.image}`,
    useCase: (meta.use_case ?? '').trim(),
    limitations: (meta.limitations ?? '').trim(),
    prompts: meta.prompts ?? [],
    related: meta.related ?? [],
    bodyPath: `skills/${id}/SKILL.md`,
    files: listFiles(dir, `skills/${id}/${meta.image}`),
    displayOrder: meta.display_order,
  };
}

const ids = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const skills = ids.map(loadSkill).filter(Boolean);

// Cross-skill references are a checked contract: every id in metadata.related
// must name a skill that exists in this repo, so a rename or removal breaks CI
// here instead of silently rotting in a published skill body.
for (const s of skills) {
  for (const rel of s.related) {
    if (rel === s.id) fail(s.id, 'metadata.related may not reference the skill itself');
    else if (!ids.includes(rel)) {
      fail(s.id, `metadata.related references unknown skill "${rel}"`);
    }
  }
}

// Gallery order: metadata.display_order ascending, then unordered skills
// alphabetically. Order travels purely as array position in the manifests —
// the field itself is never emitted, so the frozen v1 shape is untouched.
const orderOwner = new Map();
for (const s of skills) {
  if (s.displayOrder === undefined) continue;
  if (orderOwner.has(s.displayOrder)) {
    fail(s.id, `metadata.display_order ${s.displayOrder} already used by "${orderOwner.get(s.displayOrder)}"`);
  } else {
    orderOwner.set(s.displayOrder, s.id);
  }
}
skills.sort(
  (a, b) =>
    (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity) ||
    a.id.localeCompare(b.id),
);
for (const s of skills) delete s.displayOrder;

if (errors.length > 0) {
  console.error('Validation failed:\n' + errors.join('\n'));
  process.exit(1);
}

const indexJson = {
  version: 1,
  personas: [...new Set(skills.flatMap((s) => s.personas))].sort(),
  skills,
};

const marketplaceJson = {
  name: 'format-mcp-skills',
  owner: {
    name: 'Format Technologies',
    email: 'engineering@useformat.ai',
  },
  metadata: {
    description:
      'Ready-made skills for using Format inside Claude, ChatGPT, and other AI tools — powered by the Format MCP server.',
  },
  plugins: skills.map((s) => ({
    name: s.id,
    description: s.useCase,
    source: `./skills/${s.id}`,
    strict: false,
  })),
};

const OUTPUTS = [
  // index.v1.json is the path deployed apps fetch — its shape is FROZEN:
  // fields may be added under version 1, never renamed/removed/retyped. A
  // breaking change must publish index.v2.json alongside, so app builds
  // already in the field keep reading a contract that never moves.
  // index.json is kept as an unversioned alias (humans, pre-v1 consumers).
  ['index.json', indexJson],
  ['index.v1.json', indexJson],
  ['.claude-plugin/marketplace.json', marketplaceJson],
];

const check = process.argv.includes('--check');
let stale = false;

for (const [rel, data] of OUTPUTS) {
  const path = join(ROOT, rel);
  const next = JSON.stringify(data, null, 2) + '\n';
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === next) continue;
  if (check) {
    console.error(`${rel} is out of sync — run: node scripts/generate.mjs`);
    stale = true;
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, next);
    console.log(`wrote ${rel}`);
  }
}

if (check) {
  if (stale) process.exit(1);
  console.log(`ok — ${skills.length} skills, manifests in sync`);
}
