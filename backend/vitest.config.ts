import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000,
    env: {
      DATABASE_URL: '',
      NODE_ENV: 'test',
    },
  },
});
