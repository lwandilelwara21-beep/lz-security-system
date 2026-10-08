import { Injectable } from '@nestjs/common';

@Injectable()
export class IntegrationsService {
  async validateWebhookSignature(rawBody: string, signature: string | undefined, secret: string) {
    if (!signature) {
      return false;
    }

    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'lz-security-integrations',
      supported: ['attendance-events', 'report-requests', 'management-alerts'],
    };
  }
}
