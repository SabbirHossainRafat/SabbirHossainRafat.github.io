import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src'),
      '@dist': resolve(__dirname, 'dist')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: '.',
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'script.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'style.css';
          }
          return '[name].[ext]';
        }
      }
    }
  },
  server: {
    port: 3000
  }
});