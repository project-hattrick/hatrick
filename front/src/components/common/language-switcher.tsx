'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CaretDown, Check, Globe } from '@/components/common/icons';
import { useI18n, useT } from '@/i18n/i18n-provider';
import { localeLabels, locales, type Locale } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';

export function LanguageSwitcher() {
  const { locale } = useI18n();
  const t = useT();
  const pathname = usePathname();

  const hrefFor = (nextLocale: Locale) => localizePath(pathname, nextLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('common.changeLanguage')}
        className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs font-bold text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">{localeLabels[locale].shortLabel}</span>
        <CaretDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {locales.map((value) => (
          <DropdownMenuItem key={value} render={<Link href={hrefFor(value)} />}>
            <span className={`fi fi-${localeLabels[value].flag} rounded-sm`} />
            <span className="flex-1">{localeLabels[value].label}</span>
            {value === locale ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
