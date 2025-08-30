import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    splitting: false,
    sourcemap: true,
    dts: false,
    format: 'esm',
    clean: true,
})
