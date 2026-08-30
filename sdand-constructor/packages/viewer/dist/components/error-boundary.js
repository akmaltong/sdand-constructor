import { Component } from 'react';
export class ErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error(`[viewer] ErrorBoundary caught${this.props.scope ? ` (${this.props.scope})` : ''}:`, error, info.componentStack);
    }
    render() {
        return this.state.hasError ? this.props.fallback : this.props.children;
    }
}
