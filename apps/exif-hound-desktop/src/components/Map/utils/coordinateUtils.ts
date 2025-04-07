import * as geolib from 'geolib';

export const isValidCoordinate = (coord: number | null | undefined): coord is number => {
  return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
};

export const validateCoordinates = (lat: number | null | undefined, lng: number | null | undefined): boolean => {
  if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) return false;
  
  return geolib.isValidCoordinate({
    latitude: lat,
    longitude: lng
  });
};

export const getMapCenter = (
  coordinates: Array<{ lat: number; lng: number }>,
  defaultPosition: [number, number] = [0, 0]
): [number, number] => {
  if (coordinates.length === 0) return defaultPosition;
  
  const validCoords = coordinates.find(coord => 
    validateCoordinates(coord.lat, coord.lng)
  );
  
  return validCoords 
    ? [validCoords.lat, validCoords.lng]
    : defaultPosition;
}; 