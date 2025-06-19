import { build } from 'esbuild';
import path from 'path';

await build({
  entryPoints: ['src/app.js'],
  outfile: 'dist/app.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  alias: {
    '@': path.resolve(process.cwd(), 'src'),
  },
  format: 'esm',
  resolveExtensions: ['.js'],
  external: ['express', 'dotenv', '/^node:.*/'],
  minify: true,
  sourcemap: true,
});
console.log('Build completed successfully!');
