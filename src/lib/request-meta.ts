import { headers } from 'next/headers';

function firstIpPart(value: string | null) {
  if (!value) {
    return null;
  }

  const [first] = value.split(',');
  return first?.trim() || null;
}

export async function getRequestFingerprint(scope: string) {
  const headerStore = await headers();
  const forwardedFor = firstIpPart(headerStore.get('x-forwarded-for'));
  const realIp = headerStore.get('x-real-ip');
  const userAgent = headerStore.get('user-agent') || 'unknown-agent';

  const clientPart = forwardedFor || realIp || 'unknown-ip';
  return `${scope}:${clientPart}:${userAgent.slice(0, 80)}`;
}
