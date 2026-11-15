import {defineConfig, loadEnv} from 'vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
  for (const key of ['PUBLIC_STORE_DOMAIN', 'PUBLIC_STOREFRONT_API_TOKEN']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  const oxygenPlugins=oxygen();
  // MiniOxygen 4.2.3 pins workerd 2025-03-10; use its supported date locally.
  oxygenPlugins.find(plugin=>plugin.name==='oxygen:main')?.api.registerPluginOptions({compatibilityDate:'2025-03-10'});
  return {
    plugins: [...oxygenPlugins, tailwindcss(), reactRouter()],
    build: {assetsInlineLimit: 0},
    environments: {ssr: {build: {rollupOptions: {input:'./server.ts'}}}},
    ssr: {optimizeDeps: {include: ['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom','react-dom/server','react-router > set-cookie-parser','react-router > cookie','react-router']}},
  };
});
