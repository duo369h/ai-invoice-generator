/**
 * SAFE-03SEC-B2-A — authenticated document DML revocation source guard.
 *
 * Hermetic by construction: this script reads the migration and its own source.
 * It does not read environment files, create a Supabase client, make a network
 * request, write a file, or execute SQL.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION_PATH = 'supabase/migrations/20260725213909_revoke_authenticated_document_writes.sql';
const migrationFile = path.join(root, MIGRATION_PATH);
const migrationExists = fs.existsSync(migrationFile);
const migration = migrationExists ? fs.readFileSync(migrationFile, 'utf8') : '';

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

function executableStatements(source) {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--.*$/gm, ' ');

  return withoutComments
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function normalized(statement) {
  return statement.replace(/\s+/g, ' ').trim().toLowerCase();
}

function inspect(source) {
  const statements = executableStatements(source);
  const normalizedStatements = statements.map(normalized);
  const revokeStatements = normalizedStatements.filter((statement) => statement.startsWith('revoke '));
  const targetPattern = (table) => new RegExp(
    `^revoke insert\\s*,\\s*update\\s*,\\s*delete on table public\\.${table} from authenticated$`,
    'i'
  );
  const targetRoles = revokeStatements
    .map((statement) => statement.match(/\bfrom\s+([a-z_][a-z0-9_]*)\s*$/i)?.[1])
    .filter(Boolean);

  return {
    migrationExists: source.length > 0,
    invoicesRevoke: normalizedStatements.some((statement) => targetPattern('invoices').test(statement)),
    quotesRevoke: normalizedStatements.some((statement) => targetPattern('quotes').test(statement)),
    authenticatedOnly: targetRoles.length === 2 && targetRoles.every((role) => role === 'authenticated'),
    noSelectRevoke: !revokeStatements.some((statement) => /\brevoke\b[\s\S]*\bselect\b/i.test(statement)),
    noAnonTarget: !revokeStatements.some((statement) => /\b(from|to)\s+anon\b/i.test(statement)),
    noServiceRoleTarget: !revokeStatements.some((statement) => /\b(from|to)\s+service_role\b/i.test(statement)),
    noPostgresTarget: !revokeStatements.some((statement) => /\b(from|to)\s+postgres\b/i.test(statement)),
    noGrant: !normalizedStatements.some((statement) => /^grant\b/i.test(statement)),
    noDrop: !normalizedStatements.some((statement) => /^drop\b/i.test(statement)),
    noAlterTable: !normalizedStatements.some((statement) => /^alter\s+table\b/i.test(statement)),
    noCreateFunction: !normalizedStatements.some((statement) => /^create(?:\s+or\s+replace)?\s+function\b/i.test(statement)),
    noPolicyChange: !normalizedStatements.some((statement) => /^(create|alter|drop)\s+policy\b/i.test(statement)),
    noRlsChange: !normalizedStatements.some((statement) => /\brow\s+level\s+security\b/i.test(statement)),
    noTriggerChange: !normalizedStatements.some((statement) => /^(create|alter|drop)\s+trigger\b/i.test(statement)),
    noDataDml: !normalizedStatements.some((statement) => /^(insert\s+into|update\s+|delete\s+from)\b/i.test(statement)),
    noMigrationHistoryWrite: !normalizedStatements.some((statement) => /\bschema_migrations\b/i.test(statement)),
    b1First: /requires safe-03sec-b1 application code to be deployed(?: and smoke-tested)? first/i.test(source)
      && /do not apply before the four document writes use service_role/i.test(source),
    selectRetained: /select remains/i.test(source),
    b2bLater: /safe-03b2b[\s\S]{0,100}(separate|follow-up|later)[\s\S]{0,100}blocked/i.test(source),
    exactlyTwoRevokes: statements.length === 2 && revokeStatements.length === 2,
  };
}

function isValid(source) {
  return Object.values(inspect(source)).every(Boolean);
}

const results = inspect(migration);
check(`1. ${MIGRATION_PATH} exists`, migrationExists && results.migrationExists);
check('2. invoices INSERT/UPDATE/DELETE is revoked exactly', results.invoicesRevoke);
check('3. quotes INSERT/UPDATE/DELETE is revoked exactly', results.quotesRevoke);
check('4. the only REVOKE target role is authenticated', results.authenticatedOnly);
check('5. SELECT is not revoked', results.noSelectRevoke);
check('6. anon is not targeted', results.noAnonTarget);
check('7. service_role is not targeted', results.noServiceRoleTarget);
check('8. postgres is not targeted', results.noPostgresTarget);
check('9. no GRANT statement exists', results.noGrant);
check('10. no DROP statement exists', results.noDrop);
check('11. no ALTER TABLE statement exists', results.noAlterTable);
check('12. no CREATE FUNCTION statement exists', results.noCreateFunction);
check('13. no POLICY change exists', results.noPolicyChange);
check('14. no RLS change exists', results.noRlsChange);
check('15. no trigger change exists', results.noTriggerChange);
check('16. no data INSERT/UPDATE/DELETE statement exists', results.noDataDml);
check('17. no schema_migrations write exists', results.noMigrationHistoryWrite);
check('18. comments require B1 deployment before application', results.b1First);
check('19. comments state SELECT remains', results.selectRetained);
check('20. comments state SAFE-03B2B remains a blocked later stage', results.b2bLater);
check('21. migration contains exactly two executable REVOKE statements', results.exactlyTwoRevokes);

const withoutInvoices = migration.replace(
  /revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.invoices\s+from\s+authenticated\s*;/i,
  ''
);
const withoutQuotes = migration.replace(
  /revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+table\s+public\.quotes\s+from\s+authenticated\s*;/i,
  ''
);
check('22a. negative control: removing invoices REVOKE fails validation', !isValid(withoutInvoices));
check('22b. negative control: removing quotes REVOKE fails validation', !isValid(withoutQuotes));
check(
  '23. negative control: changing authenticated to service_role fails validation',
  !isValid(migration.replace(/\bauthenticated\b/gi, 'service_role'))
);
check(
  '24. negative control: adding REVOKE SELECT fails validation',
  !isValid(`${migration}\nREVOKE SELECT ON TABLE public.invoices FROM authenticated;\n`)
);

const selfSource = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
const forbiddenImports = [...selfSource.matchAll(/from\s+'([^']+)'/g)]
  .map(([, specifier]) => specifier)
  .filter((specifier) => !specifier.startsWith('node:'));
check('hermetic: imports only Node.js built-ins', forbiddenImports.length === 0);

console.log(`\nAuthenticated document DML revocation guard: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
