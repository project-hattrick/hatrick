import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { EventName } from '../events/enums/event-name.enum';
import type { OddsEventPayload } from '../events/dto';

/**
 * Projects live betting markets from odds updates (base seam).
 * Generic stub — map odds payloads to MarketType views here.
 */
@Injectable()
export class MarketProjectorService {
  private readonly logger = new Logger(MarketProjectorService.name);

  @OnEvent(EventName.OddsUpdate)
  onOdds(payload: OddsEventPayload): void {
    this.logger.debug(
      `project markets — fixture ${payload.fixtureId}, type ${payload.superOddsType}`,
    );
    // TODO: derive MarketType views from priceNames/prices.
  }
}
