import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Definido ANTES dos imports: o ConfigModule valida o JWT_SECRET ao carregar o AppModule.
    env: { JWT_SECRET: 'segredo-de-teste-com-mais-de-16-chars' },
  },
});
