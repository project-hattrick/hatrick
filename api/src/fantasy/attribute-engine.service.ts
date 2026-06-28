import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import type { MatchEventPayload } from '../events/dto';

/**
 * Fantasy attribute engine (base seam). Listens to authoritative `*.after`
 * events and will recompute player attributes from accumulated stats.
 * Generic stub — swap the body for the real formula (docs/architecture.md).
 */
@Injectable()
export class AttributeEngineService {
  private readonly logger = new Logger(AttributeEngineService.name);

  @OnEvent('*.after')
  onConfirmed(payload: MatchEventPayload): void {
    this.logger.debug(
      `recompute attributes — fixture ${payload.fixtureId}, action ${payload.action}`,
    );
    // TODO: apply attribute deltas per accumulated TxLINE stats.
  }
}
