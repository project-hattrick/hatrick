import type { Metadata } from 'next';
import { PageShell } from '@/components/common/page-shell';
import { GlassPanel } from '@/components/common/glass-panel';
import { buildMetadata } from '@/lib/seo';
import { ContactForm } from '@/components/contact/contact-form';
import { Envelope, ChatText, PaperPlaneTilt, type Icon } from '@/components/common/icons';
import { getDictionary } from '@/i18n/get-dictionary';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/locales';

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

interface Channel {
  icon: Icon;
  label: string;
  value: string;
  href: string;
}

function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dictionary = getDictionary(locale);

  return buildMetadata({
    title: dictionary.pages.contact.metadata.title,
    description: dictionary.pages.contact.metadata.description,
    path: '/contact',
    locale,
  });
}

export default async function ContactPage({ params }: LocalePageProps) {
  const locale = resolveLocale((await params).locale);
  const copy = getDictionary(locale).pages.contact;
  const channels: Channel[] = [
    { icon: Envelope, label: copy.channels.email, value: 'hello@hat-trick.app', href: 'mailto:hello@hat-trick.app' },
    { icon: ChatText, label: copy.channels.community, value: copy.channels.communityValue, href: '#' },
    { icon: PaperPlaneTilt, label: copy.channels.telegram, value: '@hattrickapp', href: '#' },
  ];

  return (
    <PageShell>
      <div>
        <header className="mb-10 flex flex-col gap-3">
          <span className="text-eyebrow text-neon">{copy.eyebrow}</span>
          <h1 className="text-display text-foreground">{copy.title}</h1>
          <p className="max-w-md text-sm text-muted-foreground">{copy.intro}</p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          <GlassPanel tone="surface" className="p-5 md:p-8">
            <ContactForm />
          </GlassPanel>

          <div className="flex flex-col gap-4">
            <h2 className="text-eyebrow text-muted-foreground">{copy.otherChannels}</h2>
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

            <p className="mt-2 text-xs text-muted-foreground">{copy.response}</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
