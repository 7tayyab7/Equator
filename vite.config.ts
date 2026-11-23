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
  // Let Hydrogen declare the production runtime date. MiniOxygen 4.3 caps it
  // only for the local workerd version; never emit a stale date to production.
  return {
    plugins: [...oxygenPlugins, tailwindcss(), reactRouter()],
    build: {assetsInlineLimit: 0},
    environments: {ssr: {build: {sourcemap:true,rollupOptions: {input:'./server.ts'}}}},
    ssr: {optimizeDeps: {include: ['react','react/jsx-runtime','react/jsx-dev-runtime','react-dom','react-dom/server','react-dom/server.edge','react-router','sanitize-html','ipaddr.js','isbot']}},
  };
});
