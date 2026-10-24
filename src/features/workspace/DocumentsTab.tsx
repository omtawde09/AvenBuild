import { useState } from 'react';
import { useCommand } from '@/app/store/useCommand';
import type { DocumentId, WorkspaceId } from '@/domain/ids';
import type { WorkspaceDocument } from '@/domain/types';
import { addDocuments, removeDocument } from '@/domain/workspace/commands';
import { workspaceDocuments } from '@/domain/workspace/selectors';
import { partyName } from '@/domain/messages/selectors';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { SectionHeading } from '@/components/ui/Feedback';
import { AttachmentList, FilePicker } from '@/components/domain/Attachments';
import { useWorkspace } from './context';

export function DocumentsTab() {
  const { ws, data, me } = useWorkspace();
  const command = useCommand();
  const docs = workspaceDocuments(data, ws.id);
  const [removing, setRemoving] = useState<WorkspaceDocument | null>(null);
  const active = ws.status === 'active';

  return (
    <div className="max-w-3xl space-y-6">
      {active ? (
        <FilePicker
          label="Add documents"
          max={30}
          current={docs.length}
          onAdd={(files) => command((s, c) => addDocuments(s, ws.id as WorkspaceId, files, c), { success: files.length === 1 ? 'Document added.' : `${files.length} documents added.` })}
        />
      ) : null}
      <section aria-labelledby="docs">
        <SectionHeading id="docs" title={`Documents (${docs.length})`} />
        <AttachmentList
          className="mt-3"
          files={docs.map((d) => d.file)}
          empty="No documents yet. Drawings, quotations, test records and photos can be listed here."
          meta={(f) => {
            const d = docs.find((x) => x.file.id === f.id);
            return d ? `added by ${partyName(data, d.addedBy)}` : '';
          }}
          canRemove={(f) => docs.find((x) => x.file.id === f.id)?.addedBy === me}
          onRemove={
            active
              ? (f) => {
                  const d = docs.find((x) => x.file.id === f.id);
                  if (d) setRemoving(d);
                }
              : undefined
          }
        />
      </section>
      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this document?"
        body={removing ? `“${removing.file.name}” will be removed from the shared list for both parties. The removal is recorded in the activity log.` : ''}
        confirmLabel="Remove document"
        tone="danger"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const d = removing;
          setRemoving(null);
          if (d) command((s, c) => removeDocument(s, d.id as DocumentId, c), { success: 'Document removed.' });
        }}
      />
    </div>
  );
}
