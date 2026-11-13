/**
 * Generates the drizzle migrations of a package from the schema files in `src/drizzle`.
 *
 * Usage: `pnpm drizzle:generate <package directory> [--name <migration name>]`
 *
 * The drizzle-storage CLI loads the schema files through CommonJS. The schema files import
 * `@credo-ts/drizzle-storage`, which depends on `@credo-ts/core` and on ESM-only packages, so
 * the CLI cannot load them. This script loads the schema files as ESM and writes the same files
 * as the CLI: the SQL file, the snapshot, and the journal.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import {
  generateDrizzleJson,
  generateMigration,
  generateSQLiteDrizzleJson,
  generateSQLiteMigration,
} from 'drizzle-kit/api'

const ZERO_ID = '00000000-0000-0000-0000-000000000000'
const BREAKPOINT = '--> statement-breakpoint\n'

interface Journal {
  version: string
  dialect: string
  entries: Array<{ idx: number; version: string; when: number; tag: string; breakpoints: boolean }>
}

interface Snapshot {
  id: string
  version: string
}

interface Dialect {
  schemaFile: string
  journalDialect: string
  generateJson: (imports: Record<string, unknown>, prevId?: string) => Promise<Snapshot>
  generateSql: (previous: Snapshot, current: Snapshot) => Promise<string[]>
}

const dialects: Record<string, Dialect> = {
  sqlite: {
    schemaFile: 'sqlite.ts',
    journalDialect: 'sqlite',
    generateJson: (imports, prevId) => generateSQLiteDrizzleJson(imports, prevId),
    generateSql: (previous, current) =>
      generateSQLiteMigration(
        previous as Parameters<typeof generateSQLiteMigration>[0],
        current as Parameters<typeof generateSQLiteMigration>[1]
      ),
  },
  postgres: {
    schemaFile: 'postgres.ts',
    journalDialect: 'postgresql',
    generateJson: async (imports, prevId) => generateDrizzleJson(imports, prevId),
    generateSql: (previous, current) =>
      generateMigration(
        previous as Parameters<typeof generateMigration>[0],
        current as Parameters<typeof generateMigration>[1]
      ),
  },
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { name: { type: 'string', default: 'initial' } },
})
const [packageName] = positionals
if (!packageName) {
  process.exit(1)
}

const packageDirectory = path.resolve(import.meta.dirname, '../packages', packageName)
const drizzleDirectory = path.join(packageDirectory, 'src/drizzle')

for (const [dialect, definition] of Object.entries(dialects)) {
  const schema = await import(path.join(drizzleDirectory, definition.schemaFile))

  const outFolder = path.join(packageDirectory, 'migrations', dialect)
  const metaFolder = path.join(outFolder, 'meta')
  mkdirSync(metaFolder, { recursive: true })

  const journalPath = path.join(metaFolder, '_journal.json')
  const journal: Journal = existsSync(journalPath)
    ? JSON.parse(readFileSync(journalPath, 'utf-8'))
    : { version: '7', dialect: definition.journalDialect, entries: [] }

  const lastEntry = journal.entries.at(-1)
  const previous: Snapshot = lastEntry
    ? JSON.parse(readFileSync(path.join(metaFolder, `${lastEntry.tag.slice(0, 4)}_snapshot.json`), 'utf-8'))
    : await definition.generateJson({})
  const current = await definition.generateJson(schema, lastEntry ? previous.id : ZERO_ID)

  const statements = await definition.generateSql(previous, current)
  if (statements.length === 0) {
    continue
  }

  const idx = lastEntry ? lastEntry.idx + 1 : 0
  const prefix = String(idx).padStart(4, '0')
  const tag = `${prefix}_${values.name}`

  const snapshot = { ...JSON.parse(JSON.stringify(current)), _meta: { columns: {}, schemas: {}, tables: {} } }
  writeFileSync(path.join(metaFolder, `${prefix}_snapshot.json`), JSON.stringify(snapshot, null, 2))

  journal.entries.push({ idx, version: current.version, when: Date.now(), tag, breakpoints: true })
  writeFileSync(journalPath, JSON.stringify(journal, null, 2))

  writeFileSync(path.join(outFolder, `${tag}.sql`), statements.join(BREAKPOINT))
}
