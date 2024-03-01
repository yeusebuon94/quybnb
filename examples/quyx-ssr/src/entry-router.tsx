import { RouterHistory, createBrowserHistory, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { RouterHandlerOptions, createRouterHandler } from 'quyx/router'
import { routeTree } from './routeTree.gen'


const routerHandler = async ({ isServer, currentPath }: RouterHandlerOptions) => {
    let history: RouterHistory

    if (isServer) {
        history = createMemoryHistory({
            initialEntries: [currentPath]
        })
    } else {
        history = createBrowserHistory()
    }

    return createRouter({
        routeTree,
        history
    })
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof routerHandler>
    }
}


export default createRouterHandler(routerHandler)