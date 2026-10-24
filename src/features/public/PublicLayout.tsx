import { Link, Outlet } from 'react-router';
import { brand } from '@/config/brand';
import { ButtonLink } from '@/components/ui/Button';
import { DemoControlDialogs } from '@/components/layout/DemoControls';
import { Wordmark } from '@/components/layout/Wordmark';
import { useActiveRole } from '@/app/store/demoStore';
import { roleHome } from '@/domain/roles';

export function PublicLayout() {
  const role = useActiveRole();
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 bg-ink px-3 py-2 text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <header className="border-b border-line">
        <div className="container-page flex h-16 items-center gap-2">
          <Link to="/" className="-ml-2 flex min-h-11 items-center px-2" title={`${brand.name} home`}>
            <Wordmark />
          </Link>
          <nav aria-label="Site" className="ml-6 hidden md:block">
            <ul className="flex gap-1 text-sm font-medium text-ink-2">
              <li>
                <a href="/#how" className="inline-flex min-h-11 items-center px-3 hover:text-ink">
                  How it works
                </a>
              </li>
              <li>
                <a href="/#services" className="inline-flex min-h-11 items-center px-3 hover:text-ink">
                  Services
                </a>
              </li>
              <li>
                <Link to="/help" className="inline-flex min-h-11 items-center px-3 hover:text-ink">
                  Help
                </Link>
              </li>
            </ul>
          </nav>
          <div className="flex-1" />
          {role ? (
            <ButtonLink to={roleHome[role]} size="sm" variant="secondary">
              Go to dashboard
            </ButtonLink>
          ) : (
            <ButtonLink to="/start" size="sm">
              Get started
            </ButtonLink>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="text-ink-3">{brand.tagline}</span>
          </div>
          <ul className="flex flex-wrap gap-x-4">
            <li>
              <Link to="/start" className="inline-flex min-h-11 items-center hover:text-ink">
                Get started
              </Link>
            </li>
            <li>
              <Link to="/help" className="inline-flex min-h-11 items-center hover:text-ink">
                Help
              </Link>
            </li>
          </ul>
        </div>
      </footer>
      <DemoControlDialogs />
    </div>
  );
}
