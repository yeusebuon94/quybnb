import { createFileRoute, createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { getData } from '../actions';

export const Route = createLazyFileRoute('/')({
    component: IndexPage
})


function IndexPage() {
    useEffect(() => {
        getData('world').then(console.log)
    }, [])

    return (
        <div>
            <h1>Home</h1>
        </div>
    )
}