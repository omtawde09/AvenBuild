import { createBrowserRouter, type RouteObject } from 'react-router';
import { RootLayout } from './RootLayout';
import { AppShell } from '@/components/layout/AppShell';
import { PublicLayout } from '@/features/public/PublicLayout';
import { LandingPage } from '@/features/public/LandingPage';
import { StartPage } from '@/features/public/StartPage';
import { HelpPage } from '@/features/public/HelpPage';
import { NotFoundPage } from '@/features/public/NotFoundPage';
import { OwnerDashboard } from '@/features/owner/OwnerDashboard';
import { MyProjectsPage } from '@/features/projects/MyProjectsPage';
import { NewProjectPage, ProjectEditPage } from '@/features/projects/ProjectEditPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { ReceivedQuotesPage } from '@/features/quotes/ReceivedQuotesPage';
import { OwnerQuotePage } from '@/features/quotes/OwnerQuotePage';
import { ComparePage } from '@/features/quotes/ComparePage';
import { DiscoverPage } from '@/features/contractors/DiscoverPage';
import { ContractorProfilePage } from '@/features/contractors/ContractorProfilePage';
import { ShortlistPage } from '@/features/contractors/ShortlistPage';
import { ContractorDashboard } from '@/features/contractor/ContractorDashboard';
import { LeadFeedPage } from '@/features/contractor/LeadFeedPage';
import { LeadDetailPage } from '@/features/contractor/LeadDetailPage';
import { QuoteComposerPage } from '@/features/quotes/composer/QuoteComposerPage';
import { PipelinePage } from '@/features/contractor/PipelinePage';
import { ContractorQuotePage } from '@/features/contractor/ContractorQuotePage';
import { ContractorProfileEditor } from '@/features/profile/ContractorProfileEditor';
import { PortfolioPage } from '@/features/profile/PortfolioPage';
import { WorkspaceListPage } from '@/features/workspace/WorkspaceListPage';
import { WorkspaceLayout } from '@/features/workspace/WorkspaceLayout';
import { WorkspaceOverview } from '@/features/workspace/WorkspaceOverview';
import { MilestonesTab } from '@/features/workspace/MilestonesTab';
import { UpdatesTab } from '@/features/workspace/UpdatesTab';
import { DocumentsTab } from '@/features/workspace/DocumentsTab';
import { ChangesTab } from '@/features/workspace/ChangesTab';
import { ActivityTab } from '@/features/workspace/ActivityTab';
import { MessagesPage } from '@/features/messages/MessagesPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { ReviewTab } from '@/features/workspace/ReviewTab';
import { OwnerSettingsPage } from '@/features/profile/OwnerSettingsPage';
import { ContractorSettingsPage } from '@/features/profile/ContractorSettingsPage';
import { RequirePersona, RequireRole } from './guards';
import { RouteErrorScreen } from './RootErrorBoundary';

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorScreen />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: 'start', element: <StartPage /> },
          { path: 'help', element: <HelpPage /> },
        ],
      },
      {
        element: <AppShell />,
        children: [
          {
            path: 'owner',
            element: <RequireRole role="owner" />,
            children: [
              { index: true, element: <OwnerDashboard /> },
              { path: 'projects', element: <MyProjectsPage /> },
              { path: 'projects/new', element: <NewProjectPage /> },
              { path: 'projects/:projectId', element: <ProjectDetailPage /> },
              { path: 'projects/:projectId/edit', element: <ProjectEditPage /> },
              { path: 'projects/:projectId/quotes', element: <ReceivedQuotesPage /> },
              { path: 'projects/:projectId/quotes/:quoteId', element: <OwnerQuotePage /> },
              { path: 'projects/:projectId/compare', element: <ComparePage /> },
              { path: 'contractors', element: <DiscoverPage /> },
              { path: 'contractors/:contractorId', element: <ContractorProfilePage /> },
              { path: 'shortlist', element: <ShortlistPage /> },
              { path: 'settings', element: <OwnerSettingsPage /> },
            ],
          },
          {
            path: 'contractor',
            element: <RequireRole role="contractor" />,
            children: [
              { index: true, element: <ContractorDashboard /> },
              { path: 'leads', element: <LeadFeedPage /> },
              { path: 'leads/:projectId', element: <LeadDetailPage /> },
              { path: 'leads/:projectId/quote', element: <QuoteComposerPage /> },
              { path: 'quotes', element: <PipelinePage /> },
              { path: 'quotes/:quoteId', element: <ContractorQuotePage /> },
              { path: 'profile', element: <ContractorProfileEditor /> },
              { path: 'portfolio', element: <PortfolioPage /> },
              { path: 'settings', element: <ContractorSettingsPage /> },
            ],
          },
          {
            element: <RequirePersona />,
            children: [
              { path: 'workspace', element: <WorkspaceListPage /> },
              {
                path: 'workspace/:workspaceId',
                element: <WorkspaceLayout />,
                children: [
                  { index: true, element: <WorkspaceOverview /> },
                  { path: 'milestones', element: <MilestonesTab /> },
                  { path: 'updates', element: <UpdatesTab /> },
                  { path: 'documents', element: <DocumentsTab /> },
                  { path: 'changes', element: <ChangesTab /> },
                  { path: 'activity', element: <ActivityTab /> },
                  { path: 'review', element: <ReviewTab /> },
                ],
              },
              { path: 'messages', element: <MessagesPage /> },
              { path: 'messages/:conversationId', element: <MessagesPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
            ],
          },
        ],
      },
      {
        element: <PublicLayout />,
        children: [{ path: '*', element: <NotFoundPage /> }],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
