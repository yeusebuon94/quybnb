import { AnyRouter } from '@tanstack/react-router'

export type RouterHandlerOptions = {
    isServer: boolean
    currentPath: string
}

export type RouterHandler<Router extends AnyRouter> = (options: RouterHandlerOptions) => Promise<Router>

export const createRouterHandler = <Router extends AnyRouter>(handler: RouterHandler<Router>) => {
    return handler
}