import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { useDemoStore } from '@/app/store/demoStore';
import { safeNext } from '@/app/navigation';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('app shell and persona selection', () => {
  it('renders the landing page with both role entry points and the demo notice', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Briefed clearly/);
    expect(screen.getByRole('link', { name: /Post a project/ })).toHaveAttribute('href', '/start?role=owner');
    expect(screen.getByRole('link', { name: /Find matching work/ })).toHaveAttribute('href', '/start?role=contractor');
    expect(screen.getAllByText(/Demo mode/).length).toBeGreaterThan(0);
  });

  it('redirects guarded routes to persona selection and continues after choosing', async () => {
    const router = renderAt('/owner/projects');
    expect(router.state.location.pathname).toBe('/start');
    await userEvent.click(screen.getByRole('button', { name: /Meera Kulkarni/ }));
    expect(router.state.location.pathname).toBe('/owner/projects');
    expect(screen.getByRole('heading', { level: 1, name: 'My projects' })).toBeInTheDocument();
  });

  it('shows an explicit wrong-role state instead of silently redirecting', async () => {
    renderAt('/start');
    await userEvent.click(screen.getByRole('button', { name: /Sahyadri Waterproofing/ }));
    const router = createMemoryRouter(routes, { initialEntries: ['/owner'] });
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('heading', { name: /This page is for Property Owners/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Switch to Property Owner persona/ }));
    expect(screen.getByRole('heading', { level: 1, name: /Good to see you, Meera/ })).toBeInTheDocument();
  });

  it('reset requires confirmation and cancelling keeps the persona', async () => {
    renderAt('/start');
    await userEvent.click(screen.getByRole('button', { name: /Meera Kulkarni/ }));
    const banner = screen.getAllByRole('button', { name: /Reset/ })[0];
    if (!banner) throw new Error('reset button missing');
    await userEvent.click(banner);
    const dialog = screen.getByRole('dialog', { name: 'Reset demo data?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(useDemoStore.getState().data.meta.activePersonaId).not.toBeNull();
  });
});

describe('safeNext', () => {
  it('only allows internal paths for the chosen role or shared routes', () => {
    expect(safeNext('/owner/projects', 'owner')).toBe('/owner/projects');
    expect(safeNext('/owner/projects', 'contractor')).toBeNull();
    expect(safeNext('/messages/abc', 'contractor')).toBe('/messages/abc');
    expect(safeNext('//evil.example', 'owner')).toBeNull();
    expect(safeNext('https://evil.example', 'owner')).toBeNull();
    expect(safeNext(null, 'owner')).toBeNull();
  });
});
