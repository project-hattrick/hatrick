/** Stable identifier per checkpoint (engine version snapshot). */
export enum CheckpointId {
  RealGkMatch = 'real-gk-match',
}

/** Which engine a checkpoint runs on. Only the Real Match GK runtime ships. */
export enum RuntimeKind {
  RealGk = 'real-gk',
}

/** Display metadata for a checkpoint. */
export interface CheckpointMeta {
  id: CheckpointId;
  title: string;
  subtitle: string;
  version: string;
  createdAt: string;
  accent: string;
  runtime: RuntimeKind;
}
