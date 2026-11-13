import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/drizzle/bundle.ts', './src/drizzle/sqlite.ts', './src/drizzle/postgres.ts'],
  format: ['esm'],
  outDir: 'build',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node22',
  tsconfig: './tsconfig.build.json',
})
