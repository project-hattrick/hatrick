import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';

interface ModeCardProps {
  title: string;
  description: string;
  href: string;
  cta: string;
}

export function ModeCard({ title, description, href, cta }: ModeCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Powered by the TxLINE live feed.
      </CardContent>
      <CardFooter>
        <Link href={href} className={buttonVariants({ className: 'w-full' })}>
          {cta}
        </Link>
      </CardFooter>
    </Card>
  );
}
