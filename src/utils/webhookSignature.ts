import { createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config';

export function verifyBuildcoSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string = config.buildco.webhookSecret,
): boolean {
  if (!secret || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const expectedHex = signatureHeader.slice('sha256='.length);
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');

  if (expectedHex.length !== computed.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(computed, 'hex'));
}
