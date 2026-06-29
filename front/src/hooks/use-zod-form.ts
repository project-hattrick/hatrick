'use client';

import { useForm, type Resolver, type UseFormProps, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';

/** useForm preset that wires a zod schema as the resolver. */
export function useZodForm<TValues extends FieldValues>(
  schema: ZodType<TValues>,
  options?: Omit<UseFormProps<TValues>, 'resolver'>,
): UseFormReturn<TValues> {
  return useForm<TValues>({ ...options, resolver: zodResolver(schema) as Resolver<TValues> });
}
