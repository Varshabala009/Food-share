import { useEffect, useRef } from 'react';
import { createAzureMapControl, addMarkerToMap } from '../azureMapsUtil';

export default function AzureMapComponent({ lat = 12.8342, lng = 79.7036, zoom = 13, markers = [] }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        mapInstance.current = await createAzureMapControl(
          mapContainer.current.id,
          lat,
          lng,
          zoom
        );

        // Add all markers
        markers.forEach((marker) => {
          addMarkerToMap(
            mapInstance.current,
            marker.lat,
            marker.lng,
            marker.title || 'Location'
          );
        });
      } catch (error) {
        console.error('❌ Map initialization failed:', error);
      }
    };

    initMap();
  }, [lat, lng, zoom, markers]);

  return (
    <div
      id="azure-map"
      ref={mapContainer}
      style={{
        width: '100%',
        height: '400px',
        borderRadius: '8px',
        marginTop: '16px',
      }}
    />
  );
}
