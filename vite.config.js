import { defineConfig, loadEnv } from 'vite'
import { readFileSync } from 'fs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

export default defineConfig(({ mode }) => {
    // โหลด .env ตาม mode (development / production)
    const env = loadEnv(mode, process.cwd(), 'VITE_')

    return {
        plugins: [
            vue(),
            nodePolyfills({ include: ['process', 'buffer'] }),
            Components({
                dirs: ['src/components'],
                extensions: ['vue'],
                deep: true,
                dts: 'src/components.d.ts',
            }),
            AutoImport({
                imports: ['vue'],
                dirs: ['src/composibles'],
                dts: 'src/auto-imports.d.ts',
            }),
        ],

        resolve: {
            alias: { '@': path.resolve(__dirname, 'src') },
        },

        // ── Inject env vars ให้ JS ที่ Vite process ใช้ได้ผ่าน import.meta.env ──
        // ค่าพวกนี้จะถูก replace ณ build time โดย Rollup
        define: {
            __ADS_BASE_URL__:               JSON.stringify(env.VITE_ADS_BASE_URL               || ''),
            __PLAYGROUND_BASE_URL__:        JSON.stringify(env.VITE_PLAYGROUND_BASE_URL        || 'https://api-mock.local'),
            __PLAYGROUND_CLIENT_ID__:       JSON.stringify(env.VITE_PLAYGROUND_CLIENT_ID       || 'demo-client'),
            __GTM_CONTAINER_ID__:           JSON.stringify(env.VITE_GTM_CONTAINER_ID           || 'GTM-XXXXXXX'),
            __PLAYGROUND_CONSENT_DEFAULT__: JSON.stringify(env.VITE_PLAYGROUND_CONSENT_DEFAULT || 'denied'),
            __ADS_IMAGE_CDN__:              JSON.stringify(env.VITE_ADS_IMAGE_CDN              || 'https://placehold.co'),
            __PLAYGROUND_USE_MOCK_API__:    JSON.stringify(env.VITE_PLAYGROUND_USE_MOCK_API    !== 'false'),
        },

        build: {
            target: 'baseline-widely-available',
            outDir: 'dist',
            lib: {
                entry: path.resolve(__dirname, 'src/entry.js'),
                name: 'AdsInjector',
                fileName: () => `com7-ads-inject-widget-v${pkg.version}.js`,
                formats: ['iife'],
            },
            rollupOptions: {
                output: {
                    exports: 'named',
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name?.endsWith('.css')) {
                            return `com7-ads-inject-widget-v${pkg.version}.css`
                        }
                        return assetInfo.name
                    },
                },
            },
        },
    }
})
