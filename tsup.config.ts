import { defineConfig } from 'tsup';
import 'dotenv/config';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  bundle: true,
  minify: true,
  treeshake: true,
  external: ['commander', 'kleur', 'ora'],
  dts: true,
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  target: 'node18',
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    'process.env.GAS_DEFAULT_ENDPOINT': JSON.stringify(process.env.GAS_DEFAULT_ENDPOINT || ''),
    'process.env.OPENAI_DEFAULT_MODEL': JSON.stringify(process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'),
    'process.env.GEMINI_DEFAULT_MODEL': JSON.stringify(process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash-lite'),
  },
});
