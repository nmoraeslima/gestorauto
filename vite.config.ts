import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'sw.js',
            registerType: 'prompt',
            injectRegister: 'auto',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'version.json'],
            manifest: {
                name: 'GestorAuto',
                short_name: 'GestorAuto',
                description: 'Sistema de Gestão para Estética Automotiva',
                theme_color: '#5DBAAA',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                // @ts-ignore
                version: process.env.npm_package_version, // Will be replaced by vite define or we rely on the manifest generator
                icons: [
                    {
                        src: '/logo.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                // Don't cleanup outdated caches automatically here, because we handle it in SW manually for strict control
                // But we can leave it true for assets managed by workbox
                cleanupOutdatedCaches: false,
                sourcemap: true
            },
            devOptions: {
                enabled: true,
                type: 'module',
            },
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3006,
        host: true, // Permite acesso pela rede local
        open: true,
    },
})
