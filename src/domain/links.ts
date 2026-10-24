/** Internal deep links used by notifications and cross-references. Single source of route shapes. */
export const links = {
  ownerProject: (projectId: string) => `/owner/projects/${projectId}`,
  ownerQuote: (projectId: string, quoteId: string) => `/owner/projects/${projectId}/quotes/${quoteId}`,
  ownerQuotes: (projectId: string) => `/owner/projects/${projectId}/quotes`,
  lead: (projectId: string) => `/contractor/leads/${projectId}`,
  contractorQuote: (quoteId: string) => `/contractor/quotes/${quoteId}`,
  contractorProfileReviews: () => '/contractor/profile#reviews',
  workspace: (workspaceId: string, tab?: 'milestones' | 'updates' | 'documents' | 'changes' | 'activity' | 'review') =>
    tab ? `/workspace/${workspaceId}/${tab}` : `/workspace/${workspaceId}`,
  conversation: (conversationId: string) => `/messages/${conversationId}`,
} as const;
