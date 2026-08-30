import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
interface ErrorBoundaryProps {
    children: ReactNode;
    fallback: ReactNode;
    /** Tag for log lines so we can tell which boundary swallowed an error. */
    scope?: string;
}
export declare class ErrorBoundary extends Component<ErrorBoundaryProps, {
    hasError: boolean;
}> {
    state: {
        hasError: boolean;
    };
    static getDerivedStateFromError(): {
        hasError: boolean;
    };
    componentDidCatch(error: Error, info: ErrorInfo): void;
    render(): ReactNode;
}
export {};
//# sourceMappingURL=error-boundary.d.ts.map