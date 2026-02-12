import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  format: {
    cjs: {
      target: ['node20'],
    },
    esm: {
      target: ['node20'],
    },
  },
  clean: true,
  dts: true,
});
