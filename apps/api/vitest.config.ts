import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // No setup file yet; tests are pure-logic. Add db setup when wiring
    // integration tests against a real test Postgres.
    pool: 'forks',
  },
});
