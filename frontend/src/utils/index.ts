const EARTH_RADIUS_METERS = 6371000;

export function getEdgeColor(pingTime: number): string {
  if (pingTime < 30) return "green";
  if (pingTime < 90) return "yellow";
  return "red";
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon2Rad = (lon2 * Math.PI) / 180;
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Ray-casting algorithm for point-in-polygon
 */
export function isPointInPolygon(lat: number, lon: number, polygon: [number, number][]): boolean {
  let x = lon, y = lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0], yi = polygon[i][1];
    let xj = polygon[j][0], yj = polygon[j][1];

    if ((x === xi && y === yi) || (x === xj && y === yj)) return true;

    let intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const MAX_LAND_HOP_DISTANCE_KM = 3000;

export function findGeozone(lat: number, lon: number, zones: any[]): string | null {
  for (const zone of zones) {
    const polygon = zone.geometry.coordinates[0];
    if (isPointInPolygon(lat, lon, polygon)) {
      return zone.properties.id;
    }
  }
  return null;
}
