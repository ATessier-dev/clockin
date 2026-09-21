// Small hand-rolled IPv4/CIDR checker — no new dependency needed for a
// single allowedCidr string per workplace (see prisma/schema.prisma).

function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let result = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    result = (result << 8) | value;
  }
  return result >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;

  const ipInt = ipToInt(ip);
  const rangeInt = ipToInt(range);
  if (ipInt === null || rangeInt === null) return false;

  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

export function matchWorkplace<T extends { allowedCidr: string }>(
  ip: string,
  workplaces: T[]
): T | null {
  if (!ip) return null;
  return workplaces.find((workplace) => isIpInCidr(ip, workplace.allowedCidr)) ?? null;
}
