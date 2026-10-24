import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { brand } from '@/config/brand';

function ErrorScreen({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="eyebrow">{brand.name} · demo</p>
      <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-ink-2">
        Your demo data is still stored in this browser. Try going back to the dashboard. If the problem keeps happening, resetting the
        demo data restores the original sample scenario.
      </p>
      {detail ? <pre className="mt-4 overflow-x-auto border border-line bg-surface p-3 font-mono text-xs whitespace-pre-wrap text-ink-3">{detail}</pre> : null}
      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/" className="inline-flex min-h-11 items-center rounded-sm bg-ink px-4 font-medium text-paper">
          Go to the home page
        </a>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center rounded-sm border border-line-strong px-4 font-medium">
          Reload the page
        </button>
      </div>
    </div>
  );
}

/** Route-level error element. */
export function RouteErrorScreen() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return <ErrorScreen title={error.status === 404 ? 'Page not found' : 'Something went wrong on this page'} detail={`${error.status} ${error.statusText}`} />;
  }
  return <ErrorScreen title="Something went wrong on this page" detail={error instanceof Error ? error.message : undefined} />;
}

/** Last-resort boundary around the whole app (covers errors outside the router). */
export class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render() {
    if (this.state.error) return <ErrorScreen title="The demo hit an unexpected error" detail={this.state.error.message} />;
    return this.props.children;
  }
}
