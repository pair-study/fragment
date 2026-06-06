// GPS 반경 판정 유틸
// apps/app과 apps/api에서 동일하게 사용합니다.

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * 두 좌표 간 거리를 미터 단위로 계산합니다 (Haversine 공식).
 */
export function getDistanceInMeters(a: Coordinates, b: Coordinates): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const x =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

/**
 * 현재 위치가 매장 반경 내에 있는지 판정합니다.
 */
export function isWithinRadius(
  current: Coordinates,
  store: Coordinates,
  radiusMeters: number,
): boolean {
  return getDistanceInMeters(current, store) <= radiusMeters
}
