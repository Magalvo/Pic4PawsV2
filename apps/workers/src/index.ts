import { appConfig } from '@pic4paws/config';
import { paymentWebhookPath } from '@pic4paws/payments';

export default {
  fetch(request: Request): Response {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', service: appConfig.serviceName });
    }

    if (url.pathname === paymentWebhookPath) {
      return Response.json({ status: 'not_configured' }, { status: 501 });
    }

    return Response.json({ message: 'Not found' }, { status: 404 });
  },
};
