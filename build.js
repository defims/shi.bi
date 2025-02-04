const esbuild = require('esbuild');
const copyStaticFiles = require('esbuild-copy-static-files');
const esbuildPluginTsc = require('esbuild-plugin-tsc');

// https://github.com/evanw/esbuild/issues/85
const replaceNodeBuiltIns = () => {
  const replace = {
      'path': require.resolve('@frida/path'),
  }
  const filter = RegExp(`^(${Object.keys(replace).join("|")})$`);
  return {
      name: "replaceNodeBuiltIns",
      setup(build) {
          build.onResolve({ filter }, arg => ({
              path: replace[arg.path],
          }));
      },
  };
}

esbuild.build({
  entryPoints: {
    background: './background.ts',
    content: './content.ts',
    'popup/index': './popup/index.ts'
  },
  outdir: './dist/',
  bundle: true,
  minify: true,
  sourcemap: false,
  watch: false,
  external: [
    'net',
    'tls',
    'crypto',
    'http',
    'https',
    'stream',
    'zlib',
    'fs',
    'url',
    'events',
    'child_process',
    'puppeteer', // @puppeteer/replay dependency
    'lighthouse', // @puppeteer/replay dependency
  ],
  plugins: [
    esbuildPluginTsc(),
    replaceNodeBuiltIns(),
    copyStaticFiles({
      src: './manifest.json',
      dest: './dist/manifest.json',
    }),
    copyStaticFiles({
      src: './icons',
      dest: './dist/icons',
    }),
    copyStaticFiles({
      src: './popup/index.html',
      dest: './dist/popup/index.html',
    }),
    copyStaticFiles({
      src: './popup/index.css',
      dest: './dist/popup/index.css',
    }),
  ],
});
