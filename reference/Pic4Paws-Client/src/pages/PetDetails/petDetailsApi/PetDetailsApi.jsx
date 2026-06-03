import {
  Box,
  Container,
  Stack,
  Text,
  Flex,
  Heading,
  SimpleGrid,
  StackDivider,
  useColorModeValue,
  List,
  ListItem
} from '@chakra-ui/react';

import { useMediaQuery } from '@chakra-ui/react';

import { useParams, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import Loading from '../../../components/Loading';
import Navbar from '../../navBar/index';
import Carrousel from '../../../components/ImageSlider';
import { getApiPet } from '../../../api/apiPets.api';
import HorizontalScrollbar from '../../../components/HorizontalScrollbar';

export default function PetDetailsApi() {
  const [pet, setPet] = useState(null);
  const [image, setImage] = useState([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [largeImageUrls, setLargeImageUrls] = useState([]);
  const [petType, setPetType] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  const [isSmallScreen] = useMediaQuery(`(max-width: 1100px)`);
  const dividerBorderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  const fetchPet = useCallback(async () => {
    try {
      const response = await getApiPet(id);
      setImage(response.data.animal.photos);
      setPet(response.data.animal);
      setPetType(response.data.animal.type);
      setAge(response.data.animal.age);
      setTags(response.data.animal.tags);
      setGender(response.data.animal.gender);
      setName(response.data.animal.name);
      const decodedText = new DOMParser().parseFromString(
        `<!doctype html><body>${response.data.animal.description || ''}`,
        'text/html'
      ).body.textContent;
      setDescription(decodedText);
    } catch (e) {
      console.log('Error Fetching Project', e);
    }
  }, [id]);

  useEffect(() => {
    if (image && image.length > 0) {
      const largeUrlsArray = image.map(photo => photo.large);
      setLargeImageUrls(largeUrlsArray);
    }
  }, [image]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  return (
    <>
      <Navbar />
      <Container>
        {pet ? (
          <SimpleGrid
            columns={{ base: 1, lg: 1 }}
            spacing={{ base: 8, md: 10 }}
            py={{ base: 0, md: 0 }}
          >
            <Flex>
              <Carrousel cards={largeImageUrls} />
            </Flex>
            <Flex
              direction={isSmallScreen ? 'column' : 'row'}
              justifyContent={isSmallScreen ? 'center' : 'space-between'}
              alignItems={isSmallScreen ? 'center' : 'flex-start'}
            >
              <Box
                mx='3rem'
                bg='white'
                p={{ base: 8, md: 16 }}
                rounded='md'
                textAlign='left'
                //mx='auto'
                my={10}
                maxW={{ base: '100%', md: '100%' }}
                width={{ base: '100%', md: '100%' }}
              >
                <Stack spacing={{ base: 6, md: 10 }}>
                  <Box as={'header'}>
                    <Heading
                      lineHeight={1.1}
                      fontWeight={600}
                      fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
                    >
                      {name}
                    </Heading>
                    <Text
                      fontWeight={600}
                      fontSize={'2xl'}
                      stye={{ color: 'pink' }}
                    >
                      {gender} {' ● '}
                      {age}
                      {' ● '}
                      {petType === 'Dog' ? (
                        <Text
                          cursor='pointer'
                          color='teal.500'
                          onClick={() =>
                            navigate(
                              `/breeds/dog-breeds/${pet.breedsId.primaryId}`
                            )
                          }
                        >
                          {pet.breeds.primary}
                        </Text>
                      ) : (
                        <Text
                          cursor='pointer'
                          color='teal.500'
                          onClick={() =>
                            navigate(
                              `/breeds/cat-breeds/${pet.breedsId.primaryId}`
                            )
                          }
                        >
                          {pet.breeds.primary}
                        </Text>
                      )}
                    </Text>
                  </Box>

                  <Stack
                    spacing={{ base: 4, sm: 6 }}
                    direction={'column'}
                    divider={
                      <StackDivider borderColor={dividerBorderColor} />
                    }
                  >
                    <Box spacing={{ base: 4, sm: 6 }}>
                      <Text
                        color={mutedTextColor}
                        fontSize={'2xl'}
                        fontWeight={'300'}
                        textAlign='left'
                      >
                        {tags && tags.map(tag => `#${tag.trim()} `)}
                      </Text>
                      <Text fontSize={'lg'}>{description}</Text>
                    </Box>

                    <Box>
                      <Text
                        fontSize={{ base: '16px', lg: '18px' }}
                        color='#455eb5'
                        fontWeight={'500'}
                        textTransform={'uppercase'}
                        mb={'4'}
                      >
                        Breeds
                      </Text>

                      <List spacing={2}>
                        <ListItem>
                          <Text as={'span'} fontWeight={'bold'}>
                            Primary Breed:
                          </Text>{' '}
                          {pet.breeds.primary}
                        </ListItem>
                        <ListItem>
                          <Text as={'span'} fontWeight={'bold'}>
                            Secondary Breed:
                          </Text>{' '}
                          {pet.breeds.secondary ? pet.breeds.secondary : 'none'}
                        </ListItem>
                        <ListItem>
                          <Text as={'span'} fontWeight={'bold'}>
                            Mixed:
                          </Text>{' '}
                          {pet.breeds.primary && pet.breeds.secondary
                            ? 'Mixed Breed'
                            : 'Pure Breed'}
                        </ListItem>
                        <ListItem>
                          <Text as={'span'} fontWeight={'bold'}>
                            Unknown Breed:
                          </Text>{' '}
                          {!pet.breeds.primary && !pet.breeds.secondary
                            ? 'Unknown Breed'
                            : 'No'}
                        </ListItem>
                      </List>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </Flex>

            {/* <LocationMap lng={location.lng} lat={location.lat} /> */}
            <Box sx={{ backgroundColor: '#638bf1' }}>
              <Text
                textAlign='center'
                fontWeight='600'
                color='white'
                fontSize='2rem'
                mt='1rem'
              >
                Other 4 Paws
              </Text>
              <HorizontalScrollbar petType={pet.type} />
            </Box>
          </SimpleGrid>
        ) : (
          <Loading />
        )}
      </Container>
    </>
  );
}
