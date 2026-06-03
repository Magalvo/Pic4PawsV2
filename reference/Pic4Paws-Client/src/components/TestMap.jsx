import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  Text
} from '@chakra-ui/react';
import { FaLocationArrow, FaTimes } from 'react-icons/fa';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete
} from '@react-google-maps/api';
import Loading from './Loading2';
import { useState, useEffect } from 'react';

const center = { lat: 48.8584, lng: 2.2945 };

const TestMap = () => {
  const [userLocation, setUserLocation] = useState(null);

  const [map, setMap] = useState(/** @type google.maps.Map */ (null));

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API,
    libraries: ['places']
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        error => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  if (!isLoaded) {
    return <Loading />;
  }

  return (
    <Flex
      position='relative'
      flexDirection='column'
      alignItems='center'
      bgColor='blue.200'
      h='100vh'
      w='100%'
    >
      <Box position='absolute' left={0} top={0} h='100%' w='100%'>
        {/* GoogleMap Box */}
        <GoogleMap
          center={userLocation ? userLocation : center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
          onLoad={map => setMap(map)}
        >
          {/* Display marker or Dir */}
          <Marker
            zIndex='9999'
            position={userLocation ? userLocation : center}
          />
        </GoogleMap>
      </Box>

      <Box
        p={4}
        borderRadius='lg'
        mt={4}
        bgColor='white'
        shadow='base'
        minW='container.md'
        zIndex='dropdown'
      >
        <HStack spacing={4}>
          <Autocomplete>
            <Input type='text' placeholder='Origin' />
          </Autocomplete>

          <Autocomplete>
            <Input type='text' placeholder='Destination' />
          </Autocomplete>

          <ButtonGroup>
            <Button colorScheme='pink' type='submit'>
              Calculate Route
            </Button>
            <IconButton
              aria-label='center back'
              icon={<FaTimes />}
              onClick={() => alert(123)}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent='space-between'>
          <Text>Distance: </Text>
          <Text>Duration: </Text>
          <IconButton
            aria-label='center back'
            icon={<FaLocationArrow />}
            isRound
            onClick={() => map.panTo(userLocation)}
          />
        </HStack>
      </Box>
    </Flex>
  );
};

export default TestMap;
