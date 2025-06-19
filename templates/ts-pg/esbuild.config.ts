import { build } from 'esbuild';
import path from 'path';

await build({
	entryPoints: ['src/app.ts'],
	outfile: 'dist/app.js',
	bundle: true,
	platform: 'node',
	target: 'node20',
	alias: {
		'@': path.resolve(process.cwd(), 'src'),
	},
	format: 'esm',
	outExtension: { '.js': '.js' },
	loader: { '.ts': 'ts' },
	resolveExtensions: ['.ts', '.js'],
	external: ['express', 'dotenv', '/^node:.*/'],
	minify: true,
	sourcemap: true,
	tsconfig: 'tsconfig.json',
});
console.log('Build completed successfully!');
