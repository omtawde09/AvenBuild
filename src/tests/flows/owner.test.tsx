import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { useDemoStore } from '@/app/store/demoStore';
import { OWNER_PERSONA_ID } from '@/data/personas';
import { P, Q, U } from '@/data/seed/ids';
import { contractorPipeline } from '@/domain/leads/pipeline';
import { TEST_ANCHOR } from '../helpers';

function renderAs(path: string) {
  useDemoStore.getState().setPersona(OWNER_PERSONA_ID);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('owner journey (UI)', () => {
  it('opening a submitted quote marks it viewed', () => {
    renderAs(`/owner/projects/${P.terrace}/quotes/${Q.terraceDeccan}`);
    expect(screen.getByRole('heading', { level: 1, name: /Quote from Deccan Seal Systems/ })).toBeInTheDocument();
    expect(useDemoStore.getState().data.quotes[Q.terraceDeccan]!.status).toBe('viewed');
  });

  it('accepting a quote creates the workspace and updates both sides consistently', async () => {
    const router = renderAs(`/owner/projects/${P.terrace}/quotes/${Q.terraceSahyadri}`);
    await userEvent.click(screen.getByRole('button', { name: 'Accept quote' }));
    const dialog = screen.getByRole('dialog', { name: /Accept Sahyadri/ });
    expect(within(dialog).getByText(/2 other quotes will be declined/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Accept and create workspace' }));

    const s = useDemoStore.getState().data;
    expect(s.projects[P.terrace]!.status).toBe('awarded');
    const ws = Object.values(s.workspaces).filter((w) => w.projectId === P.terrace);
    expect(ws).toHaveLength(1);
    expect(router.state.location.pathname).toBe(`/workspace/${ws[0]!.id}`);
    expect(s.quotes[Q.terraceDeccan]!.declineReason).toBe('awarded_elsewhere');
    const stage = contractorPipeline(s, U.sahyadri, TEST_ANCHOR).find((e) => e.project.id === P.terrace)!.stage;
    expect(stage).toBe('accepted');
    expect(Object.values(s.notifications).some((n) => n.recipientId === U.sahyadri && n.title === 'Your quote was accepted')).toBe(true);
  });

  it('cancelling the accept dialog changes nothing', async () => {
    renderAs(`/owner/projects/${P.terrace}/quotes/${Q.terraceSahyadri}`);
    await userEvent.click(screen.getByRole('button', { name: 'Accept quote' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(useDemoStore.getState().data.projects[P.terrace]!.status).toBe('reviewing');
  });

  it('requesting a revision requires a message', async () => {
    renderAs(`/owner/projects/${P.terrace}/quotes/${Q.terraceDeccan}`);
    await userEvent.click(screen.getByRole('button', { name: 'Request a revision' }));
    const dialog = screen.getByRole('dialog', { name: 'Request a revision' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));
    expect(within(dialog).getByText(/Write 10–1000 characters/)).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/What should change/), 'Please include removal of the old coba layer.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));
    expect(useDemoStore.getState().data.quotes[Q.terraceDeccan]!.status).toBe('revision_requested');
  });

  it('accept is disabled with a reason when the quote is waiting on a revision', () => {
    renderAs(`/owner/projects/${P.terrace}/quotes/${Q.terraceGanesh}`);
    expect(screen.getByRole('button', { name: 'Accept quote' })).toBeDisabled();
    expect(screen.getByText(/Wait for the contractor to resubmit/)).toBeInTheDocument();
  });

  it('project list filters change the displayed data and show a clear-filters state', async () => {
    renderAs('/owner/projects?group=drafts');
    expect(screen.getByText('1 of 5 projects')).toBeInTheDocument();
    expect(screen.getByText('Compound wall for a plot in Bavdhan')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search your projects' }), 'zzz');
    expect(screen.getByText('No projects match these filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('5 of 5 projects')).toBeInTheDocument();
  });

  it('a draft cannot be published until required fields are complete', async () => {
    renderAs(`/owner/projects/${P.compound}/edit?step=6`);
    await userEvent.click(screen.getByRole('button', { name: 'Publish project' }));
    // Jumps back to the first step with an error instead of publishing.
    expect(await screen.findByRole('heading', { level: 2, name: 'Budget & timing' })).toBeInTheDocument();
    expect(useDemoStore.getState().data.projects[P.compound]!.status).toBe('draft');
  });

  it('contractor discovery filters by service and city from the URL', () => {
    renderAs('/owner/contractors?category=plumbing&city=Pune');
    expect(screen.getByText('1 contractor')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jal Plumbing Services' })).toBeInTheDocument();
  });
});
