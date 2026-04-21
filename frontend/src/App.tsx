import L from 'leaflet';
import React from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { useTraceroutes } from './hooks/get_all';
import './index.css';

// Simple marker style matching the reference image vibes
const markerIcon = L.divIcon({
  className: 'marker-base marker-blue-pin',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const getColorByPing = (ping: number) => {
  if (ping < 60) return '#22c55e'; // Green
  if (ping < 150) return '#eab308'; // Yellow
  return '#ef4444'; // Red
};

function App() {
  const { data } = useTraceroutes();

  const hops = data?.hops || [];

  return (
    <div className="map-container">
      <MapContainer
        center={[20, 0]}
        zoom={3}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hops.map((hop, index) => {
          const originLatLon = hop.origin_location ? [hop.origin_location.latitude, hop.origin_location.longitude] : null;
          const destLatLon = hop.destination_location ? [hop.destination_location.latitude, hop.destination_location.longitude] : null;

          return (
            <React.Fragment key={index}>
              {originLatLon && (
                <Marker position={originLatLon as L.LatLngExpression} icon={markerIcon}>
                  <Popup>IP: {hop.origin_ip}</Popup>
                </Marker>
              )}

              {destLatLon && (
                <Marker position={destLatLon as L.LatLngExpression} icon={markerIcon}>
                  <Popup>IP: {hop.destination_ip}</Popup>
                </Marker>
              )}

              {originLatLon && destLatLon && (
                <>
                  <Polyline
                    positions={[originLatLon as L.LatLngExpression, destLatLon as L.LatLngExpression]}
                    pathOptions={{
                      color: '#000',
                      weight: 4,
                      opacity: 1
                    }}
                  />
                  <Polyline
                    positions={[originLatLon as L.LatLngExpression, destLatLon as L.LatLngExpression]}
                    pathOptions={{
                      color: getColorByPing(hop.ping),
                      weight: 4,
                      opacity: 1
                    }}
                  />
                </>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default App;
