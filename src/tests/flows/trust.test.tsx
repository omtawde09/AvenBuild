import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { initDemoStore, useDemoStore } from '@/app/store/demoStore';
import { CONTRACTOR_PERSONA_ID, OWNER_PERSONA_ID } from '@/data/personas';
import { U, W } from '@/data/seed/ids';
import { aggregateReviews } from '@/domain/reviews/aggregate';
import { buildContractorRows, defaultDiscoveryFilters, filterContractors } from '@/domain/matching/filters';
import { createMemoryAdapter } from '@/lib/storage/memoryAdapter';
import { TEST_ANCHOR, TEST_NOW } from '../helpers';

function renderAt(path: string, persona: typeof OWNER_PERSONA_ID) {
  useDemoStore.getState().setPersona(persona);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  return { router, view };
}

describe('reviews, settings and navigation (UI)', () => {
  it('owner reviews a completed project once; the profile aggregate updates and duplicates are blocked', async () => {
    const jal = () => aggregateReviews(Object.values(useDemoStore.getState().data.reviews).filter((r) => r.contractorId === U.jal));
    const before = jal();
    renderAt(`/workspace/${W.plumbing}/review`, OWNER_PERSONA_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Publish review' }));
    expect(screen.getByText('Choose an overall rating from 1 to 5.')).toBeInTheDocument();
    const overall = screen.getByRole('group', { name: /Overall rating/ });
    await userEvent.click(within(overall).getByRole('radio', { name: '5' }));
    await userEvent.type(screen.getByLabelText(/Your experience/), 'Clean chasing, labelled valves and a proper pressure test.');
    await userEvent.click(screen.getByRole('button', { name: 'Publish review' }));
    expect(screen.getByRole('heading', { name: 'Your review' })).toBeInTheDocument();
    expect(jal().count).toBe(before.count + 1);
    expect(screen.queryByRole('button', { name: 'Publish review' })).not.toBeInTheDocument();
  });

  it('a review cannot be left before completion', () => {
    renderAt(`/workspace/${W.bathroom}/review`, OWNER_PERSONA_ID);
    expect(screen.getByText('Reviews open once the project is marked complete.')).toBeInTheDocument();
  });

  it('owner settings persist across a refresh', async () => {
    const adapter = createMemoryAdapter();
    initDemoStore({ adapter, clock: () => TEST_NOW });
    const { view } = renderAt('/owner/settings', OWNER_PERSONA_ID);
    const name = screen.getByLabelText(/^Name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Meera K.');
    await userEvent.click(screen.getByRole('checkbox', { name: /Messages/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    view.unmount();
    initDemoStore({ adapter, clock: () => TEST_NOW });
    const s = useDemoStore.getState().data;
    expect(s.users[U.meera]!.displayName).toBe('Meera K.');
    expect(s.ownerSettings[U.meera]!.notificationPrefs.message).toBe(false);
  });

  it('hiding the contractor profile removes it from discovery', async () => {
    renderAt('/contractor/settings', CONTRACTOR_PERSONA_ID);
    await userEvent.selectOptions(screen.getByLabelText('Who can find your profile'), 'hidden');
    expect(screen.getByText(/won’t appear in owner searches/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    const rows = filterContractors(buildContractorRows(useDemoStore.getState().data), defaultDiscoveryFilters, TEST_ANCHOR);
    expect(rows.map((r) => r.profile.userId)).not.toContain(U.sahyadri);
  });

  it('navigation links have accessible names and no settings placeholder remains', () => {
    renderAt('/owner/settings', OWNER_PERSONA_ID);
    const nav = screen.getAllByRole('navigation', { name: 'Primary' })[0]!;
    for (const name of ['Home', 'Projects', 'Find contractors', 'Shortlist', 'Workspaces', 'Messages', 'Notifications', 'Settings']) {
      expect(within(nav).getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument();
    }
    expect(screen.queryByText(/Coming in Phase/)).not.toBeInTheDocument();
  });
});
