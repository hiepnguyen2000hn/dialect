import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface DialectWebhookEvent {
  event: string;
  timestamp: string;
  token?: {
    symbol: string;
    address: string;
  };
  trigger?: any;
  change?: any;
  [key: string]: any;
}

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-dialect-signature') || '';
    const webhookSecret = process.env.DIALECT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('DIALECT_WEBHOOK_SECRET environment variable is not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event: DialectWebhookEvent = JSON.parse(body);
    
    console.log('Received Dialect webhook event:', {
      event: event.event,
      timestamp: event.timestamp,
      token: event.token
    });

    switch (event.event) {
      case 'token_price_change':
        await handlePriceChangeEvent(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePriceChangeEvent(event: DialectWebhookEvent) {
  console.log('Processing price change event:', {
    token: event.token?.symbol,
    address: event.token?.address,
    change: event.change
  });
}