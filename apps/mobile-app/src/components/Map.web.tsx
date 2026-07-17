import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const GOOGLE_MAPS_API_KEY = (process.env as any).EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const Marker = ({ coordinate }: any) => {
  if (!coordinate) return null;
  return (
    <View style={styles.markerOverlay}>
      <Text style={styles.markerText}>
        📍 {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
      </Text>
    </View>
  );
};

// Singleton promise so we only load the script once
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    // Already loaded
    if ((window as any).google && (window as any).google.maps) {
      resolve();
      return;
    }

    const scriptId = 'google-maps-script-loader';
    if (document.getElementById(scriptId)) {
      // Script tag exists but not yet loaded — wait for it
      const existing = document.getElementById(scriptId) as HTMLScriptElement;
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Google Maps script failed to load')));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

const MapView = ({ children, style, initialRegion, onPress }: any) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<any>(null);
  const [googleMarker, setGoogleMarker] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const defaultLat = initialRegion?.latitude || 13.0827;
  const defaultLng = initialRegion?.longitude || 80.2707;

  // Extract selected coordinate from Marker children
  let selectedCoord: any = null;
  React.Children.forEach(children, (child) => {
    if (child && child.props && child.props.coordinate) {
      selectedCoord = child.props.coordinate;
    }
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!mapRef.current) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) return;
        if (!(window as any).google?.maps) {
          setMapError('Google Maps failed to initialize.');
          return;
        }

        const googleMap = new (window as any).google.maps.Map(mapRef.current, {
          center: { lat: defaultLat, lng: defaultLng },
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: {
            position: (window as any).google.maps.ControlPosition.RIGHT_CENTER,
          },
        });

        setMap(googleMap);

        googleMap.addListener('click', (e: any) => {
          if (onPress) {
            onPress({
              nativeEvent: {
                coordinate: {
                  latitude: e.latLng.lat(),
                  longitude: e.latLng.lng(),
                },
              },
            });
          }
        });
      })
      .catch((err) => {
        console.error('Google Maps load error:', err);
        setMapError('Failed to load Google Maps. Check your API key and internet connection.');
        googleMapsPromise = null; // allow retry
      });
  }, []);

  // Update marker position when selectedCoord changes
  useEffect(() => {
    if (!map || !(window as any).google?.maps) return;

    if (selectedCoord) {
      const position = { lat: selectedCoord.latitude, lng: selectedCoord.longitude };
      if (googleMarker) {
        googleMarker.setPosition(position);
      } else {
        const newMarker = new (window as any).google.maps.Marker({
          position,
          map,
          title: 'Selected Location',
          animation: (window as any).google.maps.Animation.DROP,
        });
        setGoogleMarker(newMarker);
      }
      map.panTo(position);
    } else if (googleMarker) {
      googleMarker.setMap(null);
      setGoogleMarker(null);
    }
  }, [map, selectedCoord]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.fallbackText}>Maps not available on this platform</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {mapError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{mapError}</Text>
        </View>
      ) : (
        <div
          ref={mapRef}
          style={{ width: '100%', height: '100%', minHeight: '300px' }}
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    minHeight: 300,
    backgroundColor: '#e8edf2',
    position: 'relative',
    overflow: 'hidden',
  },
  fallbackText: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFF5F5',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#c53030',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  markerOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCE0FF',
    shadowColor: '#0033cc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  markerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0033cc',
    textAlign: 'center',
  },
});

export default MapView;
