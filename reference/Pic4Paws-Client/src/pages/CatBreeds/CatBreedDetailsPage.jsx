import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import Paw1 from '../../assets/images/PawONE.png';
import Paw2 from '../../assets/images/PawTWO.png';
import Paw3 from '../../assets/images/PawThree.png';
import Paw4 from '../../assets/images/PawFOUR.png';
import Paw5 from '../../assets/images/Paw5.png';
import { getCatBreed, getCatImages } from '../../api/breeds.api';
import Navbar from '../../pages/navBar/index';
import Loading2 from '../../components/Loading2';
import HorizontalScrollbar from '../../components/HorizontalScrollbar';

// Helper function to get the image filename based on the rating
const getPawsImageFilename = rating => {
  switch (rating) {
    case 1:
      return Paw1;
    case 2:
      return Paw2;
    case 3:
      return Paw3;
    case 4:
      return Paw4;
    case 5:
      return Paw5;
    default:
      return '';
  }
};

const CatBreedDetailsPage = () => {
  const { breedName } = useParams();
  const [breed, setBreed] = useState(null);
  const [images, setImages] = useState([]);
  const [countryFlagUrl, setCountryFlagUrl] = useState('');
  const [countryCode, setCountryCode] = useState('');

  // Fetch all breeds
  const fetchCatBreed = useCallback(async () => {
    try {
      const response = await getCatBreed(breedName);
      setBreed(response.data);
      setCountryCode(response.data.country_code);
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
      const response = await getCatImages(query_params);

      setImages(response.data);
    } catch (err) {
      console.log(err);
    }
  }

  const getCountryFlag = useCallback(() => {
    const country_code = countryCode.toLowerCase();
    const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.2.1/flags/1x1/${country_code}.svg`;
    setCountryFlagUrl(flagUrl);
  }, [countryCode]);

  useEffect(() => {
    fetchCatBreed();
  }, [fetchCatBreed]);

  useEffect(() => {
    if (breed) {
      getImages(breed.id);
      getCountryFlag(breed.country_code);
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
                    <b>Life Span:</b> {breed.life_span} Years
                  </Text>
                  <Text>
                    <b>Origin:</b>
                    <Image
                      rounded={'md'}
                      alt={'product image'}
                      src={countryFlagUrl}
                      h={{ base: '2rem', md: '2rem', sm: '2rem', lg: '2rem' }}
                    />
                  </Text>
                  {/* Add more fields as needed */}
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
                  <Text>{breed.description}</Text>
                  <Text>
                    <b>Temperament:</b> {breed.temperament}
                  </Text>
                  <Text>
                    <b>More Information:</b>{' '}
                    <Link to={breed.wikipedia_url} target='_blank'>
                      Wikipedia
                    </Link>
                  </Text>
                </Stack>
              </Box>
            </Flex>
          </SimpleGrid>

          <Box bg='white' rounded='md' mx={10} my={10} p={{ base: 8, md: 16 }}>
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
              rounded='md'
              textAlign='center'
              mx={10}
              pt={2}
              color='#455eb5'
            >
              Traits
            </Heading>
            <SimpleGrid
              columns={3}
              spacing={4}
              bg='white'
              rounded='md'
              mx={5}
              my={5}
              p={{ base: 8, md: 16 }}
            >
              {/* Display the 12 paws images in three stacks of four */}
              <Stack
                spacing={6}
                divider={<StackDivider borderColor='gray.200' />}
              >
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Affection Level
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.affection_level)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Adaptability
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.adaptability)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Child Friendly
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.child_friendly)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Dog Friendly
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.dog_friendly)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                {/* Add more traits as needed */}
              </Stack>
              <Stack
                spacing={6}
                divider={<StackDivider borderColor='gray.200' />}
              >
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Grooming
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.grooming)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Health Issues
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.health_issues)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Intelligence
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.intelligence)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Shedding Level
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.shedding_level)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                {/* Add more traits as needed */}
              </Stack>
              <Stack
                spacing={6}
                divider={<StackDivider borderColor='gray.200' />}
              >
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Social Needs
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.social_needs)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Stranger Friendly
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.stranger_friendly)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    <Text fontWeight='bold' fontSize={20}>
                      Vocalization
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.vocalisation)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                <Box>
                  <Stack spacing={2}>
                    {' '}
                    <Text fontWeight='bold' fontSize={20}>
                      Energy Level
                    </Text>
                    <Image
                      src={getPawsImageFilename(breed.energy_level)}
                      alt='Paws'
                    />
                  </Stack>
                </Box>
                {/* Add more traits as needed */}
              </Stack>
            </SimpleGrid>
          </Box>
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
            <HorizontalScrollbar petType={'Cat'} />
          </Box>
        </Container>
      ) : (
        <Loading2 />
      )}
    </>
  );
};

export default CatBreedDetailsPage;
