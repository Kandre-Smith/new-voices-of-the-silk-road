import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 开发期把 /api /audio /uploads 代理到后端 3001 端口
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/new-voices-of-the-silk-road/' : '/',
  define: {
    'import.meta.env.VITE_STATIC': JSON.stringify(mode === 'pages' ? 'true' : 'false'),
  },
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/audio': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
}));
