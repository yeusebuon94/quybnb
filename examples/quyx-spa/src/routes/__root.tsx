import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
    component: Root
})

function Root() {
    return (
        <main>
            <div className="p-2 flex gap-2">
                <Link to="/">
                    Home
                </Link>{' '}
                <Link to="/about">
                    About
                </Link>
            </div>
            <hr />
            <Outlet />
            <TanStackRouterDevtools/>
        </main>
    )
}