import { useMemo } from "react"
import { getRenderedMatches, useRouter, useRouterState } from "@tanstack/react-router"
import { useQuyxContext } from "./QuyxContext"
import { HTMLTag } from "./types"

export const Meta = () => {
    const { assets, router } = useQuyxContext()

    const routeMeta = useRouterState({
        router,
        select: (state) => getRenderedMatches(state)
            .map((match) => match.meta!)
            .filter(Boolean)
    })

    const meta: HTMLTag[] = useMemo(() => {
        const metaByName: Record<string, true> = {}
        let meta: HTMLTag[] = []
        let title: HTMLTag | undefined
            ;[...routeMeta].reverse().forEach((metas) => {
                ;[...metas].reverse().forEach((m) => {
                    if (m.title) {
                        if (!title) {
                            title = {
                                tag: 'title',
                                children: m.title,
                            }
                        }
                    } else {
                        if (m.name) {
                            if (metaByName[m.name]) {
                                return
                            } else {
                                metaByName[m.name] = true
                            }
                        }

                        meta.push({
                            tag: 'meta',
                            attrs: {
                                ...m,
                                key: `meta-${[m.name, m.content, m.httpEquiv, m.charSet].join('')}`,
                            },
                        })
                    }
                })
            })
        if (title) {
            meta.push(title)
        }

        meta.reverse()

        return meta as HTMLTag[]
    }, [routeMeta])

    const links = useRouterState({
        router,
        select: (state) =>
            getRenderedMatches(state)
                .map((match) => match.links!)
                .filter(Boolean)
                .flat(1)
                .map((link) => ({
                    tag: 'link',
                    attrs: {
                        ...link,
                        key: `link-${[link.rel, link.href].join('')}`,
                    },
                })) as HTMLTag[],
    })

    const manifestMeta = assets.filter(
        (d: any) => d.tag !== 'script',
    ) as HTMLTag[]

    return (
        <>
            {[...meta, ...links, ...manifestMeta].map((asset, i) => (
                <Asset {...asset} key={i} />
            ))}
        </>
    )
}

export const Scripts = () => {
    const { assets, dehydrated, router } = useQuyxContext()

    const manifestScripts =
        (assets.filter(
            (d: any) => d.tag === 'script',
        ) as HTMLTag[]) ?? []

    const { scripts } = useRouterState({
        router,
        select: (state) => ({
            scripts: getRenderedMatches(state)
                .map((match) => match.scripts!)
                .filter(Boolean)
                .flat(1)
                .map(({ children, ...script }) => ({
                    tag: 'script',
                    attrs: {
                        ...script,
                        key: `script-${script.src}`,
                    },
                    children,
                })),
        }),
    })

    const allScripts = [...scripts, ...manifestScripts] as HTMLTag[]

    return (
        <>
            {import.meta.env.QUIX_SSR && <script
                id="__TSR_DEHYDRATED__"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: `
                    window.__TSR_DEHYDRATED__ = {
                    data: ${JSON.stringify(
                        router.options.transformer.stringify(dehydrated),
                    )}
                    }
                `,
                }}
            />}
            {allScripts.map((asset, i) => (
                <Asset {...asset} key={i} />
            ))}
        </>
    )
}

export function Asset({ tag, attrs, children }: HTMLTag): any {
    switch (tag) {
        case 'title':
            return <title {...attrs} key={attrs?.key}>{children}</title>
        case 'meta':
            return <meta {...attrs} key={attrs?.key}/>
        case 'link':
            return <link {...attrs} key={attrs?.key} />
        case 'style':
            return <style {...attrs} key={attrs?.key} dangerouslySetInnerHTML={{ __html: children }} />
        case 'script':
            if (attrs?.src) {
                return <script {...attrs} key={attrs?.key} suppressHydrationWarning />
            }
            if (typeof children === 'string')
                return (
                    <script
                        {...attrs}
                        dangerouslySetInnerHTML={{
                            __html: children,
                        }}
                        key={attrs?.key}
                        suppressHydrationWarning
                        
                    />
                )
            return null
        default:
            return null
    }
}
