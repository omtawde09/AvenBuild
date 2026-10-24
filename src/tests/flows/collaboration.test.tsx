import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { initDemoStore, useDemoStore } from '@/app/store/demoStore';
import { CONTRACTOR_PERSONA_ID, OWNER_PERSONA_ID } from '@/data/personas';
import { C, U, W } from '@/data/seed/ids';
import { createMemoryAdapter } from '@/lib/storage/memoryAdapter';
import { sequentialIdFactory } from '@/domain/ids';
import { unreadConversationCount } from '@/domain/messages/selectors';
import { projectActivity } from '@/domain/workspace/selectors';
import { TEST_NOW } from '../helpers';

function renderAt(path: string, persona: typeof OWNER_PERSONA_ID) {
  useDemoStore.getState().setPersona(persona);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  return { router, view };
}

describe('collaboration (UI)', () => {
  it('messages: empty messages are rejected; sending notifies the other persona; opening clears unread', async () => {
    const { view } = renderAt(`/messages/${C.bathroom}`, CONTRACTOR_PERSONA_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.getByText('Write a message before sending.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Message to Meera Kulkarni/), 'Grouting starts Monday.');
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.getAllByText(/Grouting starts Monday./).length).toBeGreaterThan(0);
    expect(unreadConversationCount(useDemoStore.getState().data, U.meera)).toBe(1);
    view.unmount();

    renderAt('/notifications', OWNER_PERSONA_ID);
    const item = screen.getAllByRole('button', { name: /New message from Sahyadri/ })[0]!;
    await userEvent.click(item);
    expect((await screen.findAllByText(/Grouting starts Monday./)).length).toBeGreaterThan(0);
    expect(unreadConversationCount(useDemoStore.getState().data, U.meera)).toBe(0);
  });

  it('milestones: contractor submits with a note, owner requests changes, contractor resubmits, owner approves', async () => {
    const first = renderAt(`/workspace/${W.bathroom}/milestones`, OWNER_PERSONA_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    let dialog = screen.getByRole('dialog', { name: 'Request changes' });
    await userEvent.type(within(dialog).getByLabelText(/What needs to change/), 'Water pools near the door; please re-slope two tiles.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));
    expect(useDemoStore.getState().data.milestones['ms_seed_bath_2']!.status).toBe('changes_requested');
    first.view.unmount();

    const second = renderAt(`/workspace/${W.bathroom}/milestones`, CONTRACTOR_PERSONA_ID);
    expect(screen.getByText(/Water pools near the door/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Resume work' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit milestone' }));
    expect(within(dialog).getByText(/Describe the work completed/)).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/What was done/), 'Relaid two tiles; bucket test shows water reaches the trap.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit milestone' }));
    expect(useDemoStore.getState().data.milestones['ms_seed_bath_2']!.status).toBe('submitted');
    second.view.unmount();

    renderAt(`/workspace/${W.bathroom}/milestones`, OWNER_PERSONA_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve milestone' }));
    expect(useDemoStore.getState().data.milestones['ms_seed_bath_2']!.status).toBe('approved');
    expect(screen.getByRole('progressbar', { name: 'Agreed progress' })).toHaveAttribute('aria-valuenow', '80');
  });

  it('change requests need the other party; accepting creates an auditable agreement revision', async () => {
    const a = renderAt(`/workspace/${W.bathroom}/changes`, CONTRACTOR_PERSONA_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Propose a change' }));
    const dialog = screen.getByRole('dialog', { name: 'Propose a change' });
    await userEvent.type(within(dialog).getByLabelText(/Reason/), 'Owner asked for an extra shelf in the niche');
    await userEvent.type(within(dialog).getByLabelText(/New end date/), '2026-10-30');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send proposal' }));
    expect(screen.getByText('Waiting for the other party.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept change' })).not.toBeInTheDocument();
    a.view.unmount();

    renderAt(`/workspace/${W.bathroom}/changes`, OWNER_PERSONA_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Accept change' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Accept change' }));
    const ws = useDemoStore.getState().data.workspaces[W.bathroom]!;
    expect(ws.agreement.at(-1)!.revision).toBe(3);
    expect(ws.agreement.at(-1)!.endDate).toBe('2026-10-30');
    expect(projectActivity(useDemoStore.getState().data, ws.projectId)[0]!.type).toBe('change_accepted');
  });

  it('both personas see the same workspace and history after a refresh', async () => {
    const adapter = createMemoryAdapter();
    initDemoStore({ adapter, clock: () => TEST_NOW, newId: sequentialIdFactory(500) });
    const one = renderAt(`/messages/${C.bathroom}`, CONTRACTOR_PERSONA_ID);
    await userEvent.type(screen.getByLabelText(/Message to Meera Kulkarni/), 'Persisted across refresh');
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    one.view.unmount();

    // "Refresh": rebuild the store from the same storage.
    initDemoStore({ adapter, clock: () => TEST_NOW });
    renderAt(`/workspace/${W.bathroom}/activity`, OWNER_PERSONA_ID);
    expect(screen.getAllByText('Message from Sahyadri Waterproofing & Civil Works').length).toBeGreaterThan(0);
  });
});
