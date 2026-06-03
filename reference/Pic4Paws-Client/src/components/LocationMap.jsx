import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Ping from '../assets/images/Pinga.png';

import { Button } from '@mui/material';

const LocationMap = ({ lat, lng }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [center, setCenter] = useState(null);
  const [marker, setMarker] = useState(null);
  const [gettingDirections, setGettingDirections] = useState(false);

  const mapContainerStyle = {
    height: '400px',
    width: '100%'
  };

  console.log(lat, lng);

  useEffect(() => {
    if (lat && lng) {
      setCenter({ lat: lat, lng: lng });
      setMarker({ lat: lat, lng: lng });
      setMapLoaded(true);
    }
  }, [lat, lng]);

  if (!mapLoaded || !center) {
    return null;
  }

  const customMarkerIcon = {
    url: Ping,
    scaledSize: window.google?.maps?.Size
      ? new window.google.maps.Size(40, 40)
      : undefined
  };
  console.log(customMarkerIcon);

  const handleGetDirections = () => {
    if (gettingDirections) return; // Prevent multiple clicks while getting directions

    setGettingDirections(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${lat},${lng}`;
          window.open(directionsUrl, '_blank');

          setGettingDirections(false);
        },
        error => {
          console.error('Error getting user location:', error);
          setGettingDirections(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={`${import.meta.env.VITE_GOOGLE_API}&callback=initMap`}
      libraries={['places']}
    >
      <div style={{ height: '400px', width: '100%' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
        >
          <Marker
            position={marker}
            icon={customMarkerIcon}
            title='Pet Location'
          />
        </GoogleMap>
      </div>
      {/* Add the button */}
      <Button
        fullWidth
        variant='contained'
        size='large'
        fontWeight='bold'
        sx={{
          mt: 8,
          py: '7',
          backgroundColor: '#638bf1',
          color: 'white',
          textTransform: 'uppercase',
          '&:hover': {
            transform: 'translateY(2px)',
            boxShadow: 'lg'
          }
        }}
        disabled={gettingDirections}
        onClick={handleGetDirections}
      >
        {gettingDirections ? 'Getting Directions...' : 'Get Directions'}
      </Button>
    </LoadScript>
  );
};

export default LocationMap;
