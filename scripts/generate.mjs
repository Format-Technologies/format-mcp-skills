// Generates index.json (gallery manifest), .claude-plugin/marketplace.json
// and orgs/index.v1.json (org-scoped skills manifest) from the SKILL.md
// frontmatter of every skill under skills/ and orgs/<slug>/.
//
// SKILL.md frontmatter is the single source of truth — never edit the
// generated files by hand. See README.md for the contract.
//
// Usage:
//   node scripts/generate.mjs           # write all files
//   node scripts/generate.mjs --check   # exit 1 if files are out of sync (CI PR gate)

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKILLS_DIR = join(ROOT, 'skills');
const ORGS_DIR = join(ROOT, 'orgs');
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

/**
 * Scope is declared by location alone: skills/ is the generic catalogue,
 * orgs/<slug>/ is that org's. A frontmatter key claiming org scope would be
 * a second authority for the same fact, so any org-ish key is rejected — in
 * generic and org skills alike.
 */
const ORG_LIKE_KEY = /^org/i;

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

/** Every file in the skill dir, repo-relative POSIX paths, sorted. */
function listAllFiles(dir) {
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
  return out.sort();
}

/** Every file in the skill dir except the card image — what the install zip contains. */
function listFiles(dir, imageRepoPath) {
  // Exact-path comparison — a basename match would also drop legitimate
  // nested assets that happen to share the card image's filename.
  return listAllFiles(dir).filter((p) => p !== imageRepoPath);
}

/**
 * MIME type per served file, published so the MCP server never has to guess.
 * Extend when a skill gains a new asset kind.
 */
function mediaTypeFor(path) {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.md':
      return 'text/markdown';
    case '.txt':
      return 'text/plain';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

/**
 * The skills-over-MCP extension serves `frontmatter` verbatim and hosts
 * compare it field-by-field against the SKILL.md they fetch, so every value
 * must survive a YAML→JSON→YAML round trip. Reject anything JSON can't
 * represent losslessly (js-yaml turns ISO timestamps into Date, anchors can
 * yield shared refs, etc.).
 */
function assertJsonSafe(value, skill, path = 'frontmatter') {
  if (value === null) return;
  const t = typeof value;
  if (t === 'string' || t === 'boolean') return;
  if (t === 'number') {
    if (!Number.isFinite(value)) fail(skill, `${path} is a non-finite number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertJsonSafe(v, skill, `${path}[${i}]`));
    return;
  }
  if (t === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [k, v] of Object.entries(value)) {
      assertJsonSafe(v, skill, `${path}.${k}`);
    }
    return;
  }
  fail(skill, `${path} holds a value JSON cannot represent (${value?.constructor?.name ?? t})`);
}

/**
 * Load and validate one skill directory. `prefix` is the repo-relative POSIX
 * path of the directory (`skills/<id>` or `orgs/<slug>/<id>`) — every path
 * in the returned entry is anchored there. `label` is what validation
 * failures cite (the id for generic skills, the full prefix for org skills).
 */
function loadSkill(id, dir, prefix, label = id) {
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    fail(label, 'missing SKILL.md');
    return null;
  }
  const fm = parseFrontmatter(readFileSync(skillMd, 'utf8'), label);
  if (!fm) return null;
  assertJsonSafe(fm, label);

  // The skills-over-MCP extension (SEP-2640) also depends on this check: the
  // final segment of every skill:// URI is the directory name, and the spec
  // requires it to equal frontmatter.name.
  if (fm.name !== id) fail(label, `frontmatter name "${fm.name}" != directory name`);
  if (!KEBAB.test(id)) fail(label, 'directory name must be kebab-case');
  if (RESERVED_IDS.includes(id)) {
    fail(label, `"${id}" is reserved for persona packs — pick another id`);
  }
  if (!fm.description?.trim()) fail(label, 'missing description');
  // Claude (Desktop/claude.ai) rejects skill uploads whose description exceeds 1024 chars
  else if (fm.description.length > 1024) {
    fail(label, `description is ${fm.description.length} chars (max 1024)`);
  }

  const meta = fm.metadata ?? {};
  for (const k of Object.keys(fm)) {
    if (ORG_LIKE_KEY.test(k)) {
      fail(label, `frontmatter key "${k}" is not allowed — scope is declared by location (skills/ vs orgs/<slug>/), never in frontmatter`);
    }
  }
  for (const k of Object.keys(meta)) {
    if (ORG_LIKE_KEY.test(k)) {
      fail(label, `frontmatter key "metadata.${k}" is not allowed — scope is declared by location (skills/ vs orgs/<slug>/), never in frontmatter`);
    }
  }
  if (!meta.title?.trim()) fail(label, 'missing metadata.title');
  if (!meta.use_case?.trim()) fail(label, 'missing metadata.use_case');
  if (!meta.limitations?.trim()) fail(label, 'missing metadata.limitations');
  if (!Array.isArray(meta.personas) || meta.personas.length === 0) {
    fail(label, 'metadata.personas must be a non-empty array');
  } else {
    for (const p of meta.personas) {
      if (!PERSONAS.includes(p)) {
        fail(label, `unknown persona "${p}" (known: ${PERSONAS.join(', ')})`);
      }
    }
  }
  if (!meta.image?.trim()) fail(label, 'missing metadata.image');
  else if (!existsSync(join(dir, meta.image))) fail(label, `image "${meta.image}" not found`);
  if (
    meta.prompts !== undefined &&
    (!Array.isArray(meta.prompts) ||
      meta.prompts.length === 0 ||
      meta.prompts.some((p) => typeof p !== 'string' || !p.trim()))
  ) {
    fail(label, 'metadata.prompts must be a non-empty array of strings when present');
  }
  if (
    meta.related !== undefined &&
    (!Array.isArray(meta.related) ||
      meta.related.length === 0 ||
      meta.related.some((r) => typeof r !== 'string' || !r.trim()))
  ) {
    fail(label, 'metadata.related must be a non-empty array of skill ids when present');
  }
  if (
    meta.display_order !== undefined &&
    (!Number.isInteger(meta.display_order) || meta.display_order < 0)
  ) {
    fail(label, 'metadata.display_order must be a non-negative integer when present');
  }

  return {
    id,
    title: meta.title,
    description: fm.description,
    personas: meta.personas ?? [],
    image: `${prefix}/${meta.image}`,
    useCase: (meta.use_case ?? '').trim(),
    limitations: (meta.limitations ?? '').trim(),
    prompts: meta.prompts ?? [],
    related: meta.related ?? [],
    bodyPath: `${prefix}/SKILL.md`,
    files: listFiles(dir, `${prefix}/${meta.image}`),
    // Skills-over-MCP extension (additive under the frozen v1 contract):
    // the parsed frontmatter, verbatim — hosts verify it field-by-field
    // against the SKILL.md they fetch — and a digest per file so served
    // bytes are provably the same commit this manifest describes. Unlike
    // files[] (the install-zip contract), resources[] includes the card
    // image: the extension enumerates every file in the skill directory.
    frontmatter: fm,
    resources: listAllFiles(dir).map((p) => ({
      path: p,
      sha256: createHash('sha256').update(readFileSync(join(ROOT, p))).digest('hex'),
      bytes: statSync(join(ROOT, p)).size,
      mediaType: mediaTypeFor(p),
    })),
    displayOrder: meta.display_order,
  };
}

/**
 * Gallery order: metadata.display_order ascending, then unordered skills
 * alphabetically. Order travels purely as array position in the manifests —
 * the field itself is never emitted, so the frozen v1 shape is untouched.
 * display_order uniqueness is scoped to the list it orders (the generic
 * catalogue, or one org's skills).
 */
function applyDisplayOrder(list, labelFor) {
  const orderOwner = new Map();
  for (const s of list) {
    if (s.displayOrder === undefined) continue;
    if (orderOwner.has(s.displayOrder)) {
      fail(labelFor(s.id), `metadata.display_order ${s.displayOrder} already used by "${orderOwner.get(s.displayOrder)}"`);
    } else {
      orderOwner.set(s.displayOrder, s.id);
    }
  }
  list.sort(
    (a, b) =>
      (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity) ||
      a.id.localeCompare(b.id),
  );
  for (const s of list) delete s.displayOrder;
}

const ids = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const skills = ids
  .map((id) => loadSkill(id, join(SKILLS_DIR, id), `skills/${id}`))
  .filter(Boolean);

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

applyDisplayOrder(skills, (id) => id);

/**
 * Org-scoped skills: orgs/<slug>/org.json binds a folder to a Format org id;
 * every subdirectory is a skill validated by the exact rules generic skills
 * follow. An org skill whose id matches a generic skill is an override (the
 * app swaps the generic skill for the org version, for that org only); any
 * other id is a net-new org skill. Returns [{ orgId, slug, skills }].
 */
function loadOrgs() {
  if (!existsSync(ORGS_DIR)) return [];
  // Non-directory entries at orgs/ root are ignored — the generated
  // orgs/index.v1.json itself lives here.
  const slugs = readdirSync(ORGS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();

  const orgIdOwner = new Map();
  const loaded = [];
  for (const slug of slugs) {
    const label = `orgs/${slug}`;
    const orgDir = join(ORGS_DIR, slug);
    if (!KEBAB.test(slug)) fail(label, 'org folder name must be kebab-case');

    const orgJsonPath = join(orgDir, 'org.json');
    let org = null;
    if (!existsSync(orgJsonPath)) {
      fail(label, 'missing org.json');
    } else {
      try {
        org = JSON.parse(readFileSync(orgJsonPath, 'utf8'));
      } catch (e) {
        fail(label, `org.json is not valid JSON: ${e.message}`);
      }
    }
    if (org !== null) {
      if (typeof org !== 'object' || Array.isArray(org)) {
        fail(label, 'org.json must be a JSON object');
        org = null;
      } else if (typeof org.orgId !== 'string' || !org.orgId.trim()) {
        fail(label, 'org.json must have a non-empty string "orgId"');
        org = null;
      } else {
        const unknown = Object.keys(org).filter((k) => k !== 'orgId');
        if (unknown.length > 0) {
          fail(label, `org.json has unknown key(s): ${unknown.join(', ')}`);
        }
        if (orgIdOwner.has(org.orgId)) {
          fail(label, `orgId "${org.orgId}" is already bound to orgs/${orgIdOwner.get(org.orgId)}`);
          org = null;
        } else {
          orgIdOwner.set(org.orgId, slug);
        }
      }
    }

    const skillIds = [];
    for (const entry of readdirSync(orgDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) skillIds.push(entry.name);
      else if (entry.name !== 'org.json') {
        fail(label, `unexpected file "${entry.name}" — an org folder holds org.json plus one directory per skill`);
      }
    }
    skillIds.sort();

    const orgSkills = skillIds
      .map((sid) => loadSkill(sid, join(orgDir, sid), `${label}/${sid}`, `${label}/${sid}`))
      .filter(Boolean);

    // Org skills may point at generic skills or siblings in the same org —
    // never at another org's skills.
    for (const s of orgSkills) {
      for (const rel of s.related) {
        if (rel === s.id) {
          fail(`${label}/${s.id}`, 'metadata.related may not reference the skill itself');
        } else if (!ids.includes(rel) && !skillIds.includes(rel)) {
          fail(`${label}/${s.id}`, `metadata.related references unknown skill "${rel}"`);
        }
      }
    }

    applyDisplayOrder(orgSkills, (id) => `${label}/${id}`);

    if (org !== null) loaded.push({ orgId: org.orgId, slug, skills: orgSkills });
  }

  // Deterministic output: the orgs map is keyed by orgId, emitted in sorted
  // key order.
  loaded.sort((a, b) => a.orgId.localeCompare(b.orgId));
  return loaded;
}

const orgs = loadOrgs();

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
  // Generic skills only — org skills are scoped to one Format workspace and
  // never appear in the public Claude Code marketplace.
  plugins: skills.map((s) => ({
    name: s.id,
    description: s.useCase,
    source: `./skills/${s.id}`,
    strict: false,
  })),
};

const orgsIndexJson = {
  version: 1,
  orgs: Object.fromEntries(
    orgs.map((o) => [o.orgId, { slug: o.slug, skills: o.skills }]),
  ),
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
  // orgs/index.v1.json carries the org-scoped catalogue under the same
  // freeze discipline: additive-only under version 1, breaking changes get
  // orgs/index.v2.json. Emitted even when there are no org folders, so
  // consumers can always fetch it. Generic manifests above must stay
  // byte-identical whatever happens under orgs/.
  ['orgs/index.v1.json', orgsIndexJson],
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
  console.log(
    `ok — ${skills.length} skills, ${orgs.length} org${orgs.length === 1 ? '' : 's'} (${orgs.reduce((n, o) => n + o.skills.length, 0)} org skills), manifests in sync`,
  );
}
