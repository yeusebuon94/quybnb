import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    meta: () => [
        {
          title: 'Hello world!'
        }
      ]
})