import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src'],
    splitting: false,
    sourcemap: true,
    dts: true,
    format: 'esm',
    clean: true,
})
