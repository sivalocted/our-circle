import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Relative base for seamless GitHub Pages and custom domain deployments
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'our-circle-static-host-files',
      apply: 'build' as const,
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: '_redirects', source: '/* /index.html 200\n' });
        this.emitFile({
          type: 'asset',
          fileName: '_headers',
          source: [
            '/*',
            '  X-Content-Type-Options: nosniff',
            '  Referrer-Policy: no-referrer',
            '  X-Frame-Options: DENY',
            '  X-Robots-Tag: noindex, nofollow',
            '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
            '',
          ].join('\n'),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: 'User-agent: *\nDisallow:\n',
        });
        this.emitFile({
          type: 'asset',
          fileName: '404.html',
          source: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Our Circle</title><script>var p=window.location.pathname;var r='/our-circle';if(p.startsWith(r)){p=p.slice(r.length);}window.location.replace(r+'/'+(p?'#'+p:'')+window.location.search);</script></head><body></body></html>`,
        });
      },
    },
  ],
  publicDir: 'public',
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('motion')) return 'vendor-motion';
            if (id.includes('lucide-react') || id.includes('canvas-confetti')) return 'vendor-ui';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
  },
});
