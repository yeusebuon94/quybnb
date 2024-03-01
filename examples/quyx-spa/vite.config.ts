import { defineConfig } from 'quyx/config'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'

export default defineConfig({
    quyx: {
        ssr: false
    },
    plugins: [TanStackRouterVite()],
    resolve: {
        alias: {
            '~': './src'
        }
    }
})