import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { useDemoStore } from '@/app/store/demoStore';
import { CONTRACTOR_PERSONA_ID } from '@/data/personas';
import { P, Q, U } from '@/data/seed/ids';
import { pauseProject } from '@/domain/projects/commands';
import type { ProjectId } from '@/domain/ids';
import { buildContractorRows, defaultDiscoveryFilters, filterContractors } from '@/domain/matching/filters';
import { ctx, TEST_ANCHOR } from '../helpers';
import { useToastStore } from '@/components/ui/toast';

function renderAs(path: string, persona = CONTRACTOR_PERSONA_ID) {
  useDemoStore.getState().setPersona(persona);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe('contractor journey (UI)', () => {
  it('lead feed shows matched leads with reasons and hides drafts and other trades', () => {
    renderAs('/contractor/leads');
    expect(screen.getByText('Terrace garden waterproofing before planting')).toBeInTheDocument();
    expect(screen.queryByText('Compound wall for a plot in Bavdhan')).not.toBeInTheDocument(); // owner draft
    expect(screen.queryByText('PEB warehouse shed, 6,000 sq ft')).not.toBeInTheDocument(); // other trade/city
    expect(screen.getAllByText(/Service match: Waterproofing/).length).toBeGreaterThan(0);
  });

  it('ignoring a lead hides it with an undo option', async () => {
    renderAs('/contractor/leads');
    const row = screen.getByText('Terrace garden waterproofing before planting').closest('li')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Ignore' }));
    expect(screen.queryByText('Terrace garden waterproofing before planting')).not.toBeInTheDocument();
    const undo = useToastStore.getState().toasts.at(-1)!.action!;
    undo.run();
    expect(await screen.findByText('Terrace garden waterproofing before planting')).toBeInTheDocument();
  });

  it('composer rejects invalid numbers with field errors and submits a valid quote', async () => {
    const router = renderAs(`/contractor/leads/${P.garden}`);
    await userEvent.click(screen.getByRole('button', { name: 'Start a quote' }));
    expect(router.state.location.pathname).toBe(`/contractor/leads/${P.garden}/quote`);

    await userEvent.type(screen.getByLabelText('Item 1 description'), 'Root-resistant membrane');
    const qty = screen.getByLabelText('Quantity');
    await userEvent.clear(qty);
    await userEvent.type(qty, '-5');
    await userEvent.type(screen.getByLabelText('Rate (₹)'), '12.345');
    await userEvent.click(screen.getByRole('button', { name: 'Submit quote' }));
    expect(qty).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Quantity must be greater than 0.').length).toBeGreaterThan(0);
    expect(screen.getByText(/Rate must be 0 or more/)).toBeInTheDocument();
    expect(useDemoStore.getState().data.projects[P.garden]!.status).toBe('open');

    await userEvent.clear(qty);
    await userEvent.type(qty, '500');
    const rate = screen.getByLabelText('Rate (₹)');
    await userEvent.clear(rate);
    await userEvent.type(rate, '180');
    expect(screen.getAllByText('₹90,000.00').length).toBeGreaterThan(0); // live line amount / subtotal
    await userEvent.click(screen.getByRole('button', { name: 'Submit quote' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Submit this quote?' })).getByRole('button', { name: 'Submit quote' }));

    const s = useDemoStore.getState().data;
    const quote = Object.values(s.quotes).find((q) => q.projectId === P.garden && q.contractorId === U.sahyadri)!;
    expect(quote.status).toBe('submitted');
    expect(s.projects[P.garden]!.status).toBe('reviewing');
    expect(Object.values(s.notifications).some((n) => n.recipientId === U.farah && n.link.endsWith(quote.id))).toBe(true);
    expect(router.state.location.pathname).toBe(`/contractor/quotes/${quote.id}`);
  });

  it('cannot quote on a paused project (button disabled with a reason)', () => {
    // The owner (a non-persona seed user) pauses a project the contractor had ignored.
    const state = useDemoStore.getState().data;
    const r = pauseProject(state, P.watertank as ProjectId, ctx(U.arjun));
    if (!r.ok) throw new Error(r.error.message);
    useDemoStore.setState({ data: r.value.state });
    renderAs(`/contractor/leads/${P.watertank}`);
    expect(screen.getByRole('button', { name: 'Start a quote' })).toBeDisabled();
    expect(screen.getByText(/paused this project/)).toBeInTheDocument();
  });

  it('withdrawing a submitted quote asks for confirmation and updates the owner side', async () => {
    renderAs(`/contractor/quotes/${Q.terraceSahyadri}`);
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Withdraw quote' }));
    const s = useDemoStore.getState().data;
    expect(s.quotes[Q.terraceSahyadri]!.status).toBe('withdrawn');
    expect(Object.values(s.notifications).some((n) => n.recipientId === U.meera && n.title === 'Quote withdrawn')).toBe(true);
    expect(screen.getByRole('link', { name: 'Revise and resubmit' })).toBeInTheDocument();
  });

  it('profile edits persist and change what owners find', async () => {
    renderAs('/contractor/profile');
    const before = filterContractors(buildContractorRows(useDemoStore.getState().data), { ...defaultDiscoveryFilters, category: 'plumbing' }, TEST_ANCHOR);
    expect(before.map((r) => r.profile.userId)).not.toContain(U.sahyadri);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Plumbing' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    const after = filterContractors(buildContractorRows(useDemoStore.getState().data), { ...defaultDiscoveryFilters, category: 'plumbing' }, TEST_ANCHOR);
    expect(after.map((r) => r.profile.userId)).toContain(U.sahyadri);
  });

  it('profile validation keeps values and shows field errors', async () => {
    renderAs('/contractor/profile');
    const name = screen.getByLabelText(/Business name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.getByText('Business name must be 3–80 characters.')).toBeInTheDocument();
    expect(name).toHaveValue('X');
    expect(useDemoStore.getState().data.contractorProfiles[U.sahyadri]!.businessName).toBe('Sahyadri Waterproofing & Civil Works');
  });

  it('portfolio entries can be added and removed with undo', async () => {
    renderAs('/contractor/portfolio');
    const count = () => Object.values(useDemoStore.getState().data.portfolio).filter((p) => p.contractorId === U.sahyadri).length;
    const start = count();
    await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));
    const dialog = screen.getByRole('dialog', { name: 'Add portfolio entry' });
    await userEvent.type(within(dialog).getByLabelText(/Title/), 'Balcony waterproofing');
    await userEvent.selectOptions(within(dialog).getByLabelText(/Category/), 'waterproofing');
    await userEvent.type(within(dialog).getByLabelText(/What was done/), 'Coated a 120 sq ft balcony with a PU membrane and coving.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add entry' }));
    expect(count()).toBe(start + 1);
    const card = screen.getByRole('heading', { name: 'Balcony waterproofing' }).closest('li')!;
    await userEvent.click(within(card).getByRole('button', { name: 'Remove' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: /Remove this portfolio entry/ })).getByRole('button', { name: 'Remove' }));
    expect(count()).toBe(start);
    useToastStore.getState().toasts.at(-1)!.action!.run();
    expect(count()).toBe(start + 1);
  });
});
