// Public views of a report never show the exact spot: a reporter often files from their own street.
// Officers and supervisors still get the exact pin through their own authenticated routes.

/** Snap a coordinate to a 0.002 degree grid (about 220 m), so nearby reports share a cell. */
export const blurCoord = (n: number): number => Math.round(n * 500) / 500;

/** Drop house/flat/building parts (any of the first two comma parts containing a digit). */
export function blurAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  const keep = parts.filter((p, i) => i >= 2 || !/\d/.test(p));
  return (keep.length >= 2 ? keep : parts.slice(-2)).join(', ');
}

/** Replace the precise location fields of a public complaint row with blurred ones. */
export function blurLocation<T extends object>(input: T): T {
  const row = input as { latitude?: unknown; longitude?: unknown; location_text?: unknown };
  return {
    ...input,
    latitude: typeof row.latitude === 'number' ? blurCoord(row.latitude) : row.latitude,
    longitude: typeof row.longitude === 'number' ? blurCoord(row.longitude) : row.longitude,
    location_text: blurAddress(row.location_text as string | null),
    landmark: null, // free text typed by the reporter, e.g. "opposite my house"
  };
}

if (process.argv[1]?.endsWith('privacy.ts')) {
  console.assert(blurCoord(28.61234) === 28.612 && blurCoord(77.20999) === 77.21, 'snaps to grid');
  console.assert(blurAddress('42, Gali 3, Sector 6, Dwarka, Delhi') === 'Sector 6, Dwarka, Delhi', 'drops house number and gali');
  console.assert(blurAddress('Main Road, Rohini') === 'Main Road, Rohini', 'keeps short addresses');
  console.log('privacy ok');
}
