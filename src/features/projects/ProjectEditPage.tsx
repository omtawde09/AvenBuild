import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { Save } from 'lucide-react';
import { useActorId, useData } from '@/app/store/demoStore';
import { useCommand } from '@/app/store/useCommand';
import type { ProjectId } from '@/domain/ids';
import { canProject } from '@/domain/projects/machine';
import { updatePublished } from '@/domain/projects/commands';
import { MATERIAL_RESPONSIBILITY, type AttachmentMeta, type MaterialResponsibility, type Project } from '@/domain/types';
import { PageHeader, StickyActions } from '@/components/layout/PageHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { SelectField, TextArea, TextField } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Feedback';
import { AttachmentList, FilePicker } from '@/components/domain/Attachments';
import { RecordNotFound } from '@/features/public/NotFoundPage';
import { materialLabel } from '@/lib/labels';
import { PROJECT_LIMITS } from '@/lib/validation/project';
import { ProjectWizard } from './wizard/ProjectWizard';

interface PublishedValues {
  title: string;
  scope: string;
  accessNotes: string;
  siteWindow: string;
  material: MaterialResponsibility;
  attachments: AttachmentMeta[];
}

function EditPublishedForm({ project }: { project: Project }) {
  const command = useCommand();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, handleSubmit, control, setValue } = useForm<PublishedValues>({
    defaultValues: {
      title: project.title,
      scope: project.scope,
      accessNotes: project.accessNotes,
      siteWindow: project.siteVisit.window,
      material: project.materialResponsibility ?? 'contractor',
      attachments: project.attachments,
    },
  });
  const files = useWatch({ control, name: 'attachments' });
  const scope = useWatch({ control, name: 'scope' });
  const id = project.id as ProjectId;

  return (
    <form
      noValidate
      className="max-w-2xl space-y-6"
      onSubmit={handleSubmit((v) => {
        const r = command(
          (s, c) =>
            updatePublished(s, id, { title: v.title, scope: v.scope, accessNotes: v.accessNotes, siteVisit: { ...project.siteVisit, window: v.siteWindow }, materialResponsibility: v.material, attachments: v.attachments }, c),
          { success: 'Brief updated. Contractors with open quotes were notified.', quietValidation: true },
        );
        if (r.ok) navigate(`/owner/projects/${id}`);
        else if (r.error.fieldErrors) setErrors(r.error.fieldErrors);
      })}
    >
      <Notice tone="info">Category, city and budget can’t change after publishing because contractors have quoted against them. Close the project and post a new one if they need to change.</Notice>
      <TextField label="Project title" required error={errors.title} {...register('title')} />
      <TextArea label="Describe the work" required rows={7} error={errors.scope} maxChars={PROJECT_LIMITS.scopeMax} currentLength={scope.length} {...register('scope')} />
      <TextField label="Visiting hours" required error={errors['siteVisit.window']} {...register('siteWindow')} />
      <SelectField label="Who supplies materials?" options={MATERIAL_RESPONSIBILITY.map((m) => ({ value: m, label: materialLabel[m] }))} {...register('material')} />
      <TextArea label="Access and site notes" optional rows={4} error={errors.accessNotes} {...register('accessNotes')} />
      <div>
        <h2 className="mb-2 text-sm font-semibold">Photos & files</h2>
        <FilePicker max={PROJECT_LIMITS.attachmentsMax} current={files.length} onAdd={(added) => setValue('attachments', [...files, ...added], { shouldDirty: true })} />
        <AttachmentList className="mt-3" files={files} onRemove={(f) => setValue('attachments', files.filter((x) => x.id !== f.id), { shouldDirty: true })} />
      </div>
      <StickyActions>
        <ButtonLink to={`/owner/projects/${id}`} variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" icon={<Save aria-hidden className="size-4" />}>
          Save changes
        </Button>
      </StickyActions>
    </form>
  );
}

export function ProjectEditPage() {
  const { projectId = '' } = useParams();
  const data = useData();
  const me = useActorId();
  const project = data.projects[projectId];
  if (!project || project.ownerId !== me) return <RecordNotFound what="project" backTo="/owner/projects" backLabel="Back to my projects" />;
  if (project.status === 'draft') return <ProjectWizard key={project.id} project={project} />;
  if (!canProject(project, 'edit_published').ok) {
    return (
      <>
        <PageHeader title="This project can’t be edited" crumbs={[{ label: 'Projects', to: '/owner/projects' }, { label: project.title, to: `/owner/projects/${project.id}` }, { label: 'Edit' }]} />
        <p className="text-ink-2">Projects that are awarded, finished or cancelled keep their brief as it was so both parties share the same record.</p>
        <ButtonLink to={`/owner/projects/${project.id}`} className="mt-4">
          Back to project
        </ButtonLink>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Edit project details" crumbs={[{ label: 'Projects', to: '/owner/projects' }, { label: project.title, to: `/owner/projects/${project.id}` }, { label: 'Edit' }]} />
      <EditPublishedForm project={project} />
    </>
  );
}

export function NewProjectPage() {
  return <ProjectWizard />;
}
