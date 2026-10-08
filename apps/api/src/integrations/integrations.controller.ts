import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

@Controller('webhooks')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('health')
  async health() {
    return this.integrationsService.getHealth();
  }

  @Post('n8n')
  async n8nWebhook(
    @Req() req: any,
    @Headers('x-signature') signature: string,
    @Body() body: any,
  ) {
    const rawBody = JSON.stringify(body ?? {});
    const isValid = this.integrationsService.validateWebhookSignature(rawBody, signature, process.env.N8N_WEBHOOK_SECRET ?? 'dev-secret');

    return {
      ok: isValid,
      received: body,
      timestamp: new Date().toISOString(),
    };
  }
}
