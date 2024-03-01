import { RouterProvider } from '@tanstack/react-router'
import { createServerHandler } from 'quyx/server'

export default createServerHandler(async (router) => {
    return (
        <RouterProvider router={router}/>
    )
})