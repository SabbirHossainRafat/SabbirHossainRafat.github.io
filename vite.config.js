import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProd    = mode === 'production';
  const apiBase   = process.env.VITE_API_URL || '';
  const buildDate = new Date().toISOString().split('T')[0];

  return {
    root:      '.',
    publicDir: 'public',

    define: {
      __API_BASE__:   JSON.stringify(isProd ? apiBase : ''),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },

    build: {
      outDir:    'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify:    'esbuild',
      target:    'es2020',
      rollupOptions: {
        input: {
          main:    resolve(__dirname, 'index.html'),
          offline: resolve(__dirname, 'offline.html'),
        },
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames:  'assets/[name].[hash].js',
          assetFileNames:  'assets/[name].[hash][extname]',
        },
      },
    },

    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target:       'http://localhost:5000',
          changeOrigin: true,
          rewrite:      path => path.replace(/^\/api/, ''),
        },
        '/contact':     { target: 'http://localhost:5000', changeOrigin: true },
        '/chat':        { target: 'http://localhost:5000', changeOrigin: true },
        '/exec':        { target: 'http://localhost:5000', changeOrigin: true },
        '/whoami':      { target: 'http://localhost:5000', changeOrigin: true },
        '/hostname':    { target: 'http://localhost:5000', changeOrigin: true },
        '/system-info': { target: 'http://localhost:5000', changeOrigin: true },
        '/stats':       { target: 'http://localhost:5000', changeOrigin: true },
        '/analytics':   { target: 'http://localhost:5000', changeOrigin: true },
        '/form-token':  { target: 'http://localhost:5000', changeOrigin: true },
        '/health':      { target: 'http://localhost:5000', changeOrigin: true },
        '/version':     { target: 'http://localhost:5000', changeOrigin: true },
      },
    },

    preview: {
      port: 4000,
    },

    esbuild: {
      target: 'es2020',
    },
  };
});