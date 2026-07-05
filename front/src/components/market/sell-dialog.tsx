'use client';

import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HoloPlayerCard } from '@/components/store/holo-player-card';
import { useZodForm } from '@/hooks/use-zod-form';
import { useMarketStore } from '@/store/market.store';
import { priceFor } from '@/config/market-listings.config';
import type { PackCard } from '@/config/pack-pool.config';

const schema = z.object({ price: z.coerce.number().int('Whole coins only').min(1, 'Set a price') });
type FormValues = z.infer<typeof schema>;

/** List an owned card on the market — RHF price form, credits the wallet on sale. */
export function SellDialog({ card, onOpenChange }: { card: PackCard | null; onOpenChange: (open: boolean) => void }) {
  const sell = useMarketStore((s) => s.sell);
  const suggested = card ? priceFor(card) : 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm<FormValues>(schema, { values: { price: suggested } });

  const onSubmit = (values: FormValues) => {
    if (!card) return;
    sell(card, values.price);
    toast.success(`Listed ${card.name} for ${values.price.toLocaleString()} coins.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(card)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sell player</DialogTitle>
          <DialogDescription>Set your asking price — coins are credited instantly (mock market).</DialogDescription>
        </DialogHeader>
        {card && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2 py-1">
              <HoloPlayerCard {...card} width={140} />
              <span className="font-bold">{card.name}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sell-price">Price (coins)</Label>
              <Input id="sell-price" type="number" min={1} step={1} aria-invalid={!!errors.price} {...register('price')} />
              {errors.price && <span className="ml-1 text-xs text-destructive">{errors.price.message}</span>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">List for sale</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
