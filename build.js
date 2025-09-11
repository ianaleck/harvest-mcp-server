#!/usr/bin/env node
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  minify: false,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node'
  }
}).catch(() => process.exit(1));