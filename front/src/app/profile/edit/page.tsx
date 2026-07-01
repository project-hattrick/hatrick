import Link from 'next/link';
import { Camera } from '@/components/common/icons';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionHeader } from '@/components/common/section-header';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';

const fields = [
  { id: 'name', label: 'Display name', placeholder: 'Kaua Miguel' },
  { id: 'handle', label: 'Username', placeholder: '@kauamigueldev' },
  { id: 'country', label: 'Country', placeholder: 'Brazil' },
];

export default function EditProfilePage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Edit profile</h1>
          <Link href="/profile" className="text-sm text-muted-foreground transition hover:text-foreground">
            Cancel
          </Link>
        </div>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="Avatar" />
          <div className="flex items-center gap-4 p-4 pt-0">
            <Avatar name="Kaua Miguel" className="size-16" />
            <Button variant="outline">
              <Camera className="size-4" /> Change photo
            </Button>
          </div>
        </GlassPanel>

        <GlassPanel radius="xl" tone="surface" className="overflow-hidden">
          <SectionHeader title="Details" />
          <div className="flex flex-col gap-4 p-4 pt-0">
            {fields.map((field) => (
              <label key={field.id} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
                <Input placeholder={field.placeholder} />
              </label>
            ))}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Bio</span>
              <textarea
                rows={3}
                placeholder="Tell other managers about your squad…"
                className="w-full rounded-lg border border-input bg-input/30 px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
              />
            </label>
          </div>
        </GlassPanel>

        <div className="flex justify-end gap-3">
          <Link href="/profile" className={buttonVariants({ variant: 'ghost' })}>
            Cancel
          </Link>
          <Button>Save changes</Button>
        </div>
      </div>
    </PageShell>
  );
}
