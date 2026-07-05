'use client';

import { useEffect } from 'react';
import { startMockSettlement } from '@/services/mock/betting.mock';

/** Runs the mock bet-settlement driver app-wide so open bets resolve anywhere. */
export function BetSettlementMount() {
  useEffect(() => startMockSettlement(), []);
  return null;
}
