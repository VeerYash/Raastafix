import { GeoPoint, Corporation } from '../types/models';

/**
 * Calculates Haversine distance between two GeoPoints in meters
 */
export function calculateDistanceMeters(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Checks if a point is inside a polygon using ray casting
 */
export function isPointInPolygon(point: GeoPoint, vs: GeoPoint[]): boolean {
  if (!vs || vs.length < 3) return false;
  const x = point.lat;
  const y = point.lng;

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lat;
    const yi = vs[i].lng;
    const xj = vs[j].lat;
    const yj = vs[j].lng;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Resolves a coordinate to the matching corporation and closest ward
 */
export function resolveJurisdiction(
  location: GeoPoint,
  corporations: Corporation[]
): { corporation: Corporation; ward: string } {
  // Check exact polygon inclusion first
  for (const corp of corporations) {
    if (isPointInPolygon(location, corp.bounds)) {
      // Pick ward based on relative positioning or default to first
      const wardIndex =
        Math.abs(Math.floor((location.lat * 1000 + location.lng * 1000) % corp.wards.length));
      return {
        corporation: corp,
        ward: corp.wards[wardIndex] || corp.wards[0],
      };
    }
  }

  // Fallback to closest polygon center if outside defined bounding boxes
  let closestCorp = corporations[0];
  let minDistance = Infinity;

  for (const corp of corporations) {
    if (corp.bounds.length > 0) {
      const centerLat =
        corp.bounds.reduce((sum, p) => sum + p.lat, 0) / corp.bounds.length;
      const centerLng =
        corp.bounds.reduce((sum, p) => sum + p.lng, 0) / corp.bounds.length;
      const dist = calculateDistanceMeters(location, {
        lat: centerLat,
        lng: centerLng,
      });
      if (dist < minDistance) {
        minDistance = dist;
        closestCorp = corp;
      }
    }
  }

  const wardIndex =
    Math.abs(Math.floor((location.lat * 1000 + location.lng * 1000) % closestCorp.wards.length));

  return {
    corporation: closestCorp,
    ward: closestCorp.wards[wardIndex] || closestCorp.wards[0],
  };
}

/**
 * Checks whether an after-photo location is within the acceptable verification radius (e.g. 25m)
 */
export function isWithinVerificationRadius(
  originalLoc: GeoPoint,
  currentLoc: GeoPoint,
  maxRadiusMeters: number = 25
): { isWithin: boolean; distance: number } {
  const distance = calculateDistanceMeters(originalLoc, currentLoc);
  return {
    isWithin: distance <= maxRadiusMeters,
    distance,
  };
}

/**
 * Format coordinates nicely for display
 */
export function formatCoordinates(loc: GeoPoint): string {
  const latDir = loc.lat >= 0 ? 'N' : 'S';
  const lngDir = loc.lng >= 0 ? 'E' : 'W';
  return `${Math.abs(loc.lat).toFixed(5)}° ${latDir}, ${Math.abs(loc.lng).toFixed(5)}° ${lngDir}`;
}
