
export interface Point {
  latitude: number;
  longitude: number;
}

export interface Geozone {
  id: string;
  name: string;
  polygon: [number, number][]; // [longitude, latitude]
}

export const EARTH_RADIUS_METERS = 6371000;
export const SPEED_OF_LIGHT_METERS = 299792458;
export const SPEED_MULTIPLIER = 3;
export const MAX_LAND_HOP_DISTANCE_KM = 3000;

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Ray-casting algorithm for point-in-polygon
 * polygon is an array of [longitude, latitude]
 */
export function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let x = lon, y = lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0], yi = polygon[i][1];
    let xj = polygon[j][0], yj = polygon[j][1];

    // Check if point is on vertex
    if ((x === xi && y === yi) || (x === xj && y === yj)) return true;

    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findGeozone(lat: number, lon: number, zones: Geozone[]): string | null {
  for (const zone of zones) {
    if (isPointInPolygon(lat, lon, zone.polygon)) {
      return zone.id;
    }
  }
  return null;
}
