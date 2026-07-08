import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata } from '@/lib/seo';
import { ContactForm } from '@/components/contact/contact-form';
import { Envelope, ChatText, PaperPlaneTilt, type Icon } from '@/components/common/icons';

export const metadata = buildMetadata({
  title: 'Contact',
  description: 'Get in touch with the Hat-trick team — support, partnerships, press, or bug reports.',
  path: '/contact',
});

interface Channel {
  icon: Icon;
  label: string;
  value: string;
  href: string;
}

const channels: Channel[] = [
  {
    icon: Envelope,
    label: 'Email',
    value: 'hello@hat-trick.app',
    href: 'mailto:hello@hat-trick.app',
  },
  {
    icon: ChatText,
    label: 'Community',
    value: 'Join our Discord',
    href: '#',
  },
  {
    icon: PaperPlaneTilt,
    label: 'Telegram',
    value: '@hattrickapp',
    href: '#',
  },
];

export default function ContactPage() {
  return (
    <PageShell>
      <div>
        <header className="mb-10 flex flex-col gap-3">
          <span className="text-eyebrow text-neon">Get in touch</span>
          <h1 className="text-display text-foreground">Contact us</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Questions, feedback, partnership enquiries or bug reports — we read every message.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          {/* Form */}
          <GlassPanel tone="surface" className="p-5 md:p-8">
            <ContactForm />
          </GlassPanel>

          {/* Channels sidebar */}
          <div className="flex flex-col gap-4">
            <h2 className="text-eyebrow text-muted-foreground">Other channels</h2>
            {channels.map((channel) => {
              const ChannelIcon = channel.icon;
              return (
                <GlassPanel
                  key={channel.label}
                  tone="dark"
                  radius="lg"
                  className="flex items-center gap-4 p-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface-2">
                    <ChannelIcon className="size-4 text-neon" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-micro text-muted-foreground">{channel.label}</span>
                    <a
                      href={channel.href}
                      className="text-sm font-medium text-foreground underline-offset-4 hover:text-neon hover:underline"
                    >
                      {channel.value}
                    </a>
                  </div>
                </GlassPanel>
              );
            })}

            <p className="mt-2 text-xs text-muted-foreground">
              We aim to respond within 24 hours during the hackathon demo period.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
