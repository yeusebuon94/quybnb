import { RouterProvider } from '@tanstack/react-router'
import { createClient } from 'quyx/client'

createClient(async (router) => {    
    return (
        <RouterProvider router={router} />
    )
})