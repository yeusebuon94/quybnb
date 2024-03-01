import { PropsWithChildren, StrictMode } from "react";

export const PassThroughtStrictMode = ({ children }: PropsWithChildren) => {
    if (import.meta.env.REACT_STRICT_MODE) {
        return <StrictMode>{children}</StrictMode>
    }
    return <>{children}</>
}