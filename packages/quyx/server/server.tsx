/// <reference types="vinxi/types/server" />
import { PipeableStream, renderToPipeableStream } from "react-dom/server";
import { type EventHandlerRequest, type H3Event, eventHandler, setHeader, setResponseStatus } from "vinxi/http";
import { getManifest } from "vinxi/manifest";
import type { AnyRouter } from "@tanstack/react-router";
import type { PropsWithChildren, ComponentType, ReactNode } from "react";
import { transformStreamWithRouter } from "../router/routerTransformer";
import { type RouterHandler } from "../router";
import { QuyxProvider } from "../shared/QuyxContext";
import type { HTMLTag } from "../shared/types";
import { SPA_WRAPPER_ID } from "../shared/constants";

//@ts-expect-error
import quyxRouter from '#quyx/router'
const routerEntry = quyxRouter as RouterHandler<AnyRouter>

//@ts-expect-error
import appComponent from '#quyx/app'
import { PassThroughtStrictMode } from "../shared/PassThroughtStrictMode";
const AppComponent = appComponent as ComponentType<PropsWithChildren>

export type ServerHandler = (router: AnyRouter, event: H3Event<EventHandlerRequest>) => Promise<ReactNode>

const SPAWrapper = ({ children }: PropsWithChildren) => {
	return (
		<div id={SPA_WRAPPER_ID}>{children}</div>
	)
}

const PassThrought = ({ children }: PropsWithChildren) => {
	return (
		<>
			{children}
		</>
	)
}

export const createServerHandler = (handler: ServerHandler) => {
	return eventHandler(async (event) => {
		const clientManifest = getManifest("client");
		const assets = await clientManifest.inputs[clientManifest.handler].assets() as unknown as HTMLTag[];
		const router = await routerEntry({ isServer: true, currentPath: event.path })

		if (import.meta.env.QUIX_SSR) {
			await router.load()
		}

		const result = await handler(router, event)
		const Wrapper = import.meta.env.QUIX_SSR ? PassThrought : SPAWrapper


		const stream = await new Promise<PipeableStream>(async (resolve) => {
			const stream = renderToPipeableStream((
				<PassThroughtStrictMode>
					<QuyxProvider assets={assets} router={router}>
						<AppComponent>
							<Wrapper>
								{result}
							</Wrapper>
						</AppComponent>
					</QuyxProvider>
				</PassThroughtStrictMode>
			), {
				onShellReady() {
					resolve(stream)
				},
				bootstrapModules: [
					clientManifest.inputs[clientManifest.handler].output.path,
				],
				bootstrapScriptContent: `window.manifest = ${JSON.stringify(
					await clientManifest.json(),
				)}`,
			})
		})

		setHeader(event, 'Content-Type', 'text/html')

		if (router.hasNotFoundMatch()) {
			setResponseStatus(event, 404)
		}

		const transforms = [transformStreamWithRouter(router)]

		const transformedStream = transforms.reduce(
			(stream, transform) => stream.pipe(transform as any),
			stream,
		)

		return transformedStream
	})
}