import { Meta, Scripts } from 'quyx'
import type { ReactNode } from 'react'

interface AppProps {
    children: ReactNode
}

export default function App({ children }: AppProps) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
                <Meta />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    )
}