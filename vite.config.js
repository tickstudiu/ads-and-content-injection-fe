import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)))

export default defineConfig({
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
})
