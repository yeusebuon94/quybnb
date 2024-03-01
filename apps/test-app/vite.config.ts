import { defineConfig } from 'quyx/config'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
    quyx: {
        ssr: true
    },
    plugins: [TanStackRouterVite()],
    resolve: {
        alias: {
            '~': './src'
        }
    }
})