import { useRef, useState, useEffect } from 'react';
import {
  GoogleMap,
  LoadScript,
  StandaloneSearchBox,
  Marker
} from '@react-google-maps/api';

import { Input } from '@chakra-ui/react';

const libraries = ['places'];

const MapComponent = ({ userLocation, onSelectLocation }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapContainerRef = useRef(null);
  const searchBoxRef = useRef(null);

  const onLoad = map => {
    mapContainerRef.current = map;
  };

  const onPlacesChanged = () => {
    const places = searchBoxRef.current.getPlaces();
    if (places && places.length > 0) {
      const latitude = places[0].geometry.location.lat();
      const longitude = places[0].geometry.location.lng();
      setSelectedLocation({ lat: latitude, lng: longitude });
    }
  };

  useEffect(() => {
    if (onSelectLocation) {
      onSelectLocation(selectedLocation);
    }
  }, [selectedLocation, onSelectLocation]);

  return (
    <LoadScript
      googleMapsApiKey={`${import.meta.env.VITE_GOOGLE_API}&callback=initMap`} //&callback=initMap
      libraries={libraries}
    >
      <div>
        {/* Map */}
        <div style={{ height: '400px', width: '100%' }}>
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            center={
              selectedLocation ||
              (userLocation ? userLocation : { lat: 0, lng: 0 })
            }
            zoom={selectedLocation ? 14 : 10}
            onLoad={onLoad}
          >
            {selectedLocation && <Marker position={selectedLocation} />}
          </GoogleMap>
        </div>

        {/* StandaloneSearchBox */}
        <div style={{ marginTop: '16px', width: '100%', maxWidth: '100%' }}>
          <StandaloneSearchBox
            onLoad={searchBox => (searchBoxRef.current = searchBox)}
            onPlacesChanged={onPlacesChanged}
          >
            <Input
              type='text'
              placeholder='Enter a location'
              style={{
                boxSizing: 'border-box',
                border: '1px solid transparent',
                width: '100%',
                height: '32px',
                padding: '0 12px',
                borderRadius: '3px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                fontSize: '14px',
                outline: 'none',
                textOverflow: 'ellipsis'
              }}
            />
          </StandaloneSearchBox>
        </div>
      </div>
    </LoadScript>
  );
};

export default MapComponent;
