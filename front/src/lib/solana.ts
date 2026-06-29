import { clusterApiUrl } from '@solana/web3.js';
import { env } from './env';

/** RPC endpoint for the configured cluster (devnet by default). */
export const solanaEndpoint = clusterApiUrl(env.solanaCluster);
