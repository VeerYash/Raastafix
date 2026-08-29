import { useState, useEffect, useCallback } from 'react';
import { GeoPoint } from '../types/models';

interface GeolocationState {
  location: GeoPoint | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

// Default center (Bengaluru tech corridor)
export const DEFAULT_COORDS: GeoPoint = {
  lat: 12.9230,
  lng: 77.6520,
};

export function useGeolocation(autoFetch: boolean = true) {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionDenied: false,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        location: DEFAULT_COORDS,
        accuracy: null,
        loading: false,
        error: 'Geolocation is not supported by your browser',
        permissionDenied: true,
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (error) => {
        let msg = 'Unable to retrieve location';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please select point manually on map.';
        }
        setState({
          location: DEFAULT_COORDS,
          accuracy: null,
          loading: false,
          error: msg,
          permissionDenied: error.code === error.PERMISSION_DENIED,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      getLocation();
    }
  }, [autoFetch, getLocation]);

  const setManualLocation = useCallback((loc: GeoPoint) => {
    setState((prev) => ({
      ...prev,
      location: loc,
      accuracy: 5,
      loading: false,
      error: null,
    }));
  }, []);

  return {
    ...state,
    refetch: getLocation,
    setManualLocation,
  };
}
