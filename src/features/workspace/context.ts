import { useOutletContext } from 'react-router';
import type { UserId } from '@/domain/ids';
import type { DemoState, Project, Workspace } from '@/domain/types';

export interface WorkspaceContext {
  ws: Workspace;
  project: Project;
  me: UserId;
  role: 'owner' | 'contractor';
  data: DemoState;
}

/** Workspace data shared by every workspace tab (provided by WorkspaceLayout). */
export function useWorkspace(): WorkspaceContext {
  return useOutletContext<WorkspaceContext>();
}
