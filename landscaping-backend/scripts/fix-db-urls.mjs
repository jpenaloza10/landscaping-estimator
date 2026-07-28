#!/usr/bin/env node
/**
 * Percent-encode the password inside DATABASE_URL / DIRECT_URL in .env.
 *
 * Postgres passwords frequently contain characters that are structural in a
 * URL (@ : / ? # & % space). Left raw, the parser splits in the wrong place
 * and Prisma reports P1013 "invalid domain character".
 *
 * Usage:  node scripts/fix-db-urls.mjs [path-to-env]      # rewrites the file
 *         node scripts/fix-db-urls.mjs --dry-run          # report only
 *
 * Secrets are never printed — only masked diagnostics.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const envPath = args.find((a) => !a.startsWith("--")) ?? ".env";

const KEYS = ["DATABASE_URL", "DIRECT_URL"];

if (!existsSync(envPath)) {
  console.error(`No such file: ${envPath}`);
  process.exit(1);
}

/** Split "postgresql://user:pass@host/db?args" without tripping over a raw @ or : in the password. */
function parse(raw) {
  const schemeEnd = raw.indexOf("://");
  if (schemeEnd === -1) return null;

  const scheme = raw.slice(0, schemeEnd);
  const rest = raw.slice(schemeEnd + 3);

  // Password may contain '@', so the LAST '@' separates credentials from host.
  const at = rest.lastIndexOf("@");
  if (at === -1) return null;

  const credentials = rest.slice(0, at);
  const hostAndPath = rest.slice(at + 1);

  // Password may contain ':', so the FIRST ':' separates user from password.
  const colon = credentials.indexOf(":");
  const user = colon === -1 ? credentials : credentials.slice(0, colon);
  const password = colon === -1 ? "" : credentials.slice(colon + 1);

  return { scheme, user, password, hostAndPath };
}

/** Decode first so an already-encoded password isn't double-encoded. */
function normalize(password) {
  let decoded = password;
  try {
    decoded = decodeURIComponent(password);
  } catch {
    // Not valid encoding — treat as literal.
  }
  return encodeURIComponent(decoded);
}

const original = readFileSync(envPath, "utf8");
let updated = original;
let changes = 0;
let problems = 0;

for (const key of KEYS) {
  const match = updated.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) {
    console.log(`${key.padEnd(13)} not present`);
    continue;
  }

  const raw = match[1].trim().replace(/^["']|["']$/g, "");
  const parts = parse(raw);

  if (!parts) {
    console.log(`${key.padEnd(13)} UNPARSEABLE — must look like postgresql://user:pass@host:5432/db`);
    problems++;
    continue;
  }

  const { scheme, user, password, hostAndPath } = parts;

  if (!/^postgres(ql)?$/.test(scheme)) {
    console.log(`${key.padEnd(13)} bad scheme "${scheme}" — expected postgresql://`);
    problems++;
    continue;
  }

  const host = hostAndPath.split(/[/?]/)[0];
  if (/[^\w.\-:]/.test(host)) {
    console.log(`${key.padEnd(13)} host looks wrong: "${host}"`);
    problems++;
  }

  const risky = [...new Set([...password].filter((c) => /[@:/?#&=% ]/.test(c)))];
  const encoded = normalize(password);
  const needsFix = encoded !== password;

  console.log(
    `${key.padEnd(13)} host=${host} pw_len=${password.length}` +
      (risky.length ? ` needs_encoding=[${risky.join(" ")}]` : " ok")
  );

  if (needsFix) {
    const fixed = `${scheme}://${user}:${encoded}@${hostAndPath}`;
    try {
      new URL(fixed);
    } catch {
      console.log(`  -> still invalid after encoding; check the host portion by hand`);
      problems++;
      continue;
    }
    updated = updated.replace(match[0], `${key}=${fixed}`);
    changes++;
    console.log(`  -> re-encoded`);
  }
}

if (changes && !dryRun) {
  copyFileSync(envPath, `${envPath}.bak`);
  writeFileSync(envPath, updated);
  console.log(`\nWrote ${changes} fix(es). Backup: ${envPath}.bak`);
} else if (changes) {
  console.log(`\n${changes} fix(es) available — re-run without --dry-run to apply.`);
} else {
  console.log("\nNo password encoding changes needed.");
}

if (problems) {
  console.log("Some values need manual attention (see above).");
  process.exit(1);
}
