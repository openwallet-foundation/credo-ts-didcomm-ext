import type { DrizzleRecordBundle } from '@credo-ts/drizzle-storage'

/**
 * Returns the migration definition of the bundle.
 *
 * The schema files sit next to the bundle file. The migration files sit in the `migrations`
 * directory of the package, two levels up from the bundle file.
 *
 * @param dirname the directory of the bundle file: `src/drizzle` in the sources, `build/drizzle` in the build
 */
export function bundleMigrationDefinition(dirname: string): DrizzleRecordBundle['migrations'] {
  const extension = dirname.endsWith('src/drizzle') ? 'ts' : 'mjs'
  const migrationsDirectory = `${dirname}/../../migrations`

  return {
    postgres: {
      schemaPath: `${dirname}/postgres.${extension}`,
      migrationsPath: `${migrationsDirectory}/postgres`,
    },
    sqlite: {
      schemaPath: `${dirname}/sqlite.${extension}`,
      migrationsPath: `${migrationsDirectory}/sqlite`,
    },
  }
}

/**
 * Checks at compile time that the array contains every value of the enum.
 *
 * The postgres enums list the values as string literals, because drizzle-kit cannot load the
 * decorated Credo classes.
 */
export function exhaustiveArray<U extends string, T extends readonly string[]>(
  _type: U,
  arr: T &
    (T[number] extends `${U}`
      ? `${U}` extends T[number]
        ? T
        : `Expected array to contain '${U}'`
      : `Expect array to contain '${U}'`)
): T {
  return arr
}
