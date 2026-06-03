import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Image,
  Stack,
  StackDivider,
  Container,
  SimpleGrid,
  Flex
} from '@chakra-ui/react';
import Loading from '../../components/Loading2';
import Carrousel from '../../components/ImageSlider';
import { getDogBreed, getDogImages } from '../../api/breeds.api';
import Navbar from '../../pages/navBar/index';
import Loading2 from '../../components/Loading2';
import HorizontalScrollbar from '../../components/HorizontalScrollbar';

const DogBreedDetailsPage = () => {
  const { breedName } = useParams();
  const [breed, setBreed] = useState(null);
  const [images, setImages] = useState([]);
  const [originString, setOriginString] = useState('');
  const [flagsUrls, setFlagsUrls] = useState([]);

  // Fetch all breeds
  const fetchDogBreed = useCallback(async () => {
    try {
      const response = await getDogBreed(breedName);
      setBreed(response.data);
      setOriginString(response.data.origin);
    } catch (err) {
      console.log(err);
    }
  }, [breedName]);

  // Fetch images based on breed ID
  async function getImages(breedName) {
    try {
      const query_params = {
        breed_ids: breedName,
        limit: 8
      };
      const response = await getDogImages(query_params);

      setImages(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  const getCountryFlag = useCallback(async () => {
    const countryNames = originString.split(',').map(country => country.trim());
    const flagUrls = [];

    for (const countryName of countryNames) {
      const countryNameLower = countryName.toLowerCase();

      try {
        const response = await fetch(
          `https://api.restcountries.com/v3/name/${countryNameLower}`
        );
        const countries = await response.json();

        if (countries.length === 0) {
          console.error(`Country name "${countryName}" not found.`);
          continue; // Move on to the next country if the current one is not found.
        }

        // Assuming the API returns the country code in the alpha-2 format (e.g., 'DE' for Germany)
        const country_code = (countries[0].cca2 || countries[0].alpha2Code).toLowerCase();
        const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.2.1/flags/1x1/${country_code}.svg`;
        flagUrls.push(flagUrl);
        setFlagsUrls(flagUrls);
      } catch (error) {
        console.error('Error fetching country information:', error);
      }
    }

    // At this point, flagUrls will contain an array of flag image URLs for each country in the original string.
    // You can use this array as needed, for example, to display the flags in your user interface or perform other actions.
  }, [originString]);

  useEffect(() => {
    fetchDogBreed();
  }, [fetchDogBreed]);

  useEffect(() => {
    if (breed) {
      getImages(breed.id);
      getCountryFlag();
    }
  }, [breed, getCountryFlag]);

  if (!breed) {
    return <Loading />;
  }

  return (
    <>
      <Navbar />
      {breed ? (
        <Container>
          <Carrousel cards={images.map(image => image.url)} />
          <Heading
            lineHeight={1.1}
            fontWeight={600}
            fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
            rounded='md'
            textAlign='left'
            mx={10}
            pt={10}
          >
            {breed.name}
          </Heading>
          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            spacing={{ base: 8, md: 10 }}
            py={{ base: 1, md: 1 }}
          >
            <Flex direction='column' alignItems='flex-start'>
              <Box
                bg='white'
                p={{ base: 4, md: 8 }}
                rounded='md'
                textAlign='left'
                mx={10}
                my={10}
                maxW={{ base: '100%', md: '700px' }}
                width={{ base: '100%', md: 'calc(100% - 2rem)' }}
              >
                {/* Display breed details like weight, height, family, type, etc. */}
                <Heading
                  fontWeight={600}
                  fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
                  rounded='md'
                  textAlign='left'
                  mb={3}
                  color='#455eb5'
                >
                  Characteristics
                </Heading>
                <Stack
                  spacing={4}
                  divider={<StackDivider borderColor='gray.200' />}
                >
                  <Text>
                    <b>Weight:</b> {breed.weight.metric} kg
                  </Text>
                  <Text>
                    <b>Height:</b> {breed.height.metric} cm
                  </Text>
                  <Text>
                    <b>Life Span:</b> {breed.life_span}
                  </Text>
                  <Text>
                    <b>Origin:</b>
                  </Text>
                  {flagsUrls.map((flagUrl, index) => (
                    <Image
                      key={index}
                      rounded={'md'}
                      alt={`product image ${index}`} // Provide a unique alt text for each image
                      src={flagUrl}
                      h={{ base: '2rem', md: '2rem', sm: '2rem', lg: '2rem' }}
                    />
                  ))}
                </Stack>
              </Box>
            </Flex>
            <Flex direction='column' alignItems='flex-start'>
              <Box
                bg='white'
                p={{ base: 4, md: 8 }}
                rounded='md'
                textAlign='left'
                mr={10}
                my={10}
                maxW={{ base: '100%', md: '700px' }}
                width={{ base: '100%', md: 'calc(100% - 2rem)' }}
              >
                {/* Display breed details like weight, height, family, type, etc. */}
                <Heading
                  fontWeight={600}
                  fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
                  rounded='md'
                  textAlign='left'
                  mb={3}
                  color='#455eb5'
                >
                  Description
                </Heading>
                <Stack
                  spacing={4}
                  divider={<StackDivider borderColor='gray.200' />}
                >
                  <Text>
                    <b>Breed For:</b> {breed.bred_for}
                  </Text>
                  <Text>
                    <b>Breed Group:</b> {breed.breed_group}
                  </Text>
                  <Text>
                    <b>Temperament:</b> {breed.temperament}
                  </Text>
                </Stack>
              </Box>
            </Flex>
          </SimpleGrid>

          <Box>
            <Text
              textAlign='center'
              fontWeight='600'
              color='white'
              fontSize='2rem'
              mt='1rem'
            >
              Other 4 Paws
            </Text>
            <HorizontalScrollbar petType={'Dog'} />
          </Box>
        </Container>
      ) : (
        <Loading2 />
      )}
    </>
  );
};

export default DogBreedDetailsPage;
