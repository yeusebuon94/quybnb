import { createApp, type AppOptions, type ClientRouterSchema } from "vinxi"
import defu from "defu"
import { config } from "vinxi/plugins/config";
import react, { Options as ReactOptions } from "@vitejs/plugin-react";
import { join } from "node:path";
import type { CustomizableConfig } from "vinxi/dist/types/lib/vite-dev";
import { serverFunctions } from "@vinxi/server-functions/plugin";

export interface ConfigOptions extends Omit<CustomizableConfig, 'plugins'> {
    quyx?: {
        appRoot?: string
        ssr?: boolean
        server?: AppOptions['server']
        features?: {
            serverFunctions?: boolean
            //serverComponents?: boolean
        }
    }
    react?: ReactOptions & {
        strictMode?: boolean
    }
    plugins?: ClientRouterSchema['plugins']
}

const defaultConfigOptions: ConfigOptions['quyx'] = {
    appRoot: './src',
    ssr: true,
    server: {},
    features: {
        serverFunctions: true,
        // serverComponents: true
    }
}

export const defineConfig = (baseOptions: ConfigOptions = {}) => {
    let { plugins = [], quyx = {}, react: { strictMode: reactStrictMode = true, ...reactOptions } = {}, ...userConfig } = baseOptions;
    quyx = defu(quyx, defaultConfigOptions)
    const isSsrEnabled: boolean = quyx.ssr
    const isServerFunctionsEnabled: boolean = quyx.features?.serverFunctions ?? true
    //const isServerComponentsEnabled: boolean = quyx.features?.serverComponents ?? true

    let server = quyx.server
    if (!isSsrEnabled) {
        server = { ...server, prerender: { routes: ["/"] } };
    }

    return createApp({
        server: server,
        routers: [
            {
                name: "public",
                type: "static",
                dir: "./public",
                base: "/",
            },
            {
                name: "client",
                type: "client",
                handler: `${quyx.appRoot}/entry-client.tsx`,
                target: "browser",
                plugins: async () => {
                    return [
                        config("user", {
                            ...userConfig,
                            optimizeDeps: {
                                ...(userConfig.optimizeDeps || {}),
                                exclude: [
                                    ...(userConfig.optimizeDeps?.exclude || []),
                                    '#quyx/app',
                                    '#quyx/router'
                                ]
                            }
                        }),
                        ...(typeof plugins === "function" ? [...(await (plugins as any)())] : plugins),
                        ...(isServerFunctionsEnabled ? [serverFunctions.client()] : []),
                        react(reactOptions),
                        config("app-client", {
                            resolve: {
                                ...userConfig.resolve,
                                alias: {
                                    "#quyx/app": join(process.cwd(), quyx.appRoot, `app.tsx`),
                                    "#quyx/router": join(process.cwd(), quyx.appRoot, `entry-router.tsx`),
                                    ...userConfig.resolve?.alias
                                }
                            },
                            define: {
                                "import.meta.env.SSR": JSON.stringify(false),
                                "import.meta.env.REACT_STRICT_MODE": JSON.stringify(reactStrictMode),
                                "import.meta.env.QUIX_SSR": JSON.stringify(isSsrEnabled),
                                "import.meta.env.SERVER_BASE_URL": JSON.stringify(quyx?.server?.baseURL ?? ""),
                                ...userConfig.define
                            }
                        })
                    ]
                },
                base: "/_build",
            },
            {
                name: "ssr",
                type: "http",
                handler: `${quyx.appRoot}/entry-server.tsx`,
                target: "server",
                plugins: async () => {
                    return [
                        config("user", {
                            ...userConfig,
                            optimizeDeps: {
                                ...(userConfig.optimizeDeps || {}),
                                exclude: [
                                    ...(userConfig.optimizeDeps?.exclude || []),
                                    '#quyx/app',
                                    '#quyx/router'
                                ]
                            }
                        }),
                        ...(typeof plugins === "function" ? [...(await (plugins as any)())] : plugins),
                        react(reactOptions),
                        config("app-server", {
                            resolve: {
                                ...userConfig.resolve,
                                alias: {
                                    "#quyx/app": join(process.cwd(), quyx.appRoot, `app.tsx`),
                                    "#quyx/router": join(process.cwd(), quyx.appRoot, `entry-router.tsx`),
                                    ...userConfig.resolve?.alias
                                }
                            },
                            define: {
                                "import.meta.env.SSR": JSON.stringify(true),
                                "import.meta.env.REACT_STRICT_MODE": JSON.stringify(reactStrictMode),
                                "import.meta.env.QUIX_SSR": JSON.stringify(isSsrEnabled),
                                "import.meta.env.SERVER_BASE_URL": JSON.stringify(quyx?.server?.baseURL ?? ""),
                                ...userConfig.define
                            }
                        })
                    ]
                }
            },
            ...(isServerFunctionsEnabled ?
                [serverFunctions.router({
                    plugins: async () => {
                        return [
                            config("user", {
                                ...userConfig,
                                optimizeDeps: {
                                    ...(userConfig.optimizeDeps || {}),
                                    exclude: [
                                        ...(userConfig.optimizeDeps?.exclude || []),
                                        '#quyx/app',
                                        '#quyx/router'
                                    ]
                                }
                            }),
                            ...(typeof plugins === "function" ? [...(await (plugins as any)())] : plugins),
                            react(reactOptions),
                            config("app-server", {
                                resolve: {
                                    ...userConfig.resolve,
                                    alias: {
                                        "#quyx/app": join(process.cwd(), quyx.appRoot, `app.tsx`),
                                        "#quyx/router": join(process.cwd(), quyx.appRoot, `entry-router.tsx`),
                                        ...userConfig.resolve?.alias
                                    }
                                },
                                define: {
                                    "import.meta.env.SSR": JSON.stringify(true),
                                    "import.meta.env.REACT_STRICT_MODE": JSON.stringify(reactStrictMode),
                                    "import.meta.env.QUIX_SSR": JSON.stringify(isSsrEnabled),
                                    ...userConfig.define
                                }
                            })
                        ]
                    }
                })] : [])
        ],
    })
}