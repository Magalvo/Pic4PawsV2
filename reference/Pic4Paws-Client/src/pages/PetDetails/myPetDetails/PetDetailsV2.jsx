import {
  Box,
  Container,
  Stack,
  Text,
  Flex,
  Button,
  Heading,
  SimpleGrid,
  StackDivider,
  useColorModeValue,
  List,
  ListItem,
  Divider
} from '@chakra-ui/react';

import { useMediaQuery } from '@chakra-ui/react';

import { useParams, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import Loading from '../../../components/Loading2';
import Navbar from '../../navBar/index';
import Carrousel from '../../../components/ImageSlider';
import { getPet } from '../../../api/pets.api';
import LocationMap from '../../../components/LocationMap';
import Friend from '../../../components/Friend';
import { getId } from '../../../api/users.api';
import DogAdoptionModal from '../../../components/DogAdoptModal';
import DogSupportModal from '../../../components/dogSupportModal';
import CatAdoptionModal from '../../../components/CatAdoptModal';
import CatSupportModal from '../../../components/catSupportModal';

export default function PetDetailsV2() {
  const [pet, setPet] = useState(null);
  const [image, setImage] = useState([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [tags, setTags] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [largeImageUrls, setLargeImageUrls] = useState([]);
  const [location, setLocation] = useState([]);
  const [petType, setPetType] = useState('');
  const [creator, setCreator] = useState(null);
  const { id } = useParams();
  const [creatorId, setCreatorId] = useState('');
  const navigate = useNavigate();

  const [isSmallScreen] = useMediaQuery(`(max-width: 1100px)`);
  const dividerBorderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  const contactButtonColor = useColorModeValue('white', 'gray.900');

  const fetchPet = useCallback(async () => {
    try {
      const response = await getPet(id);
      setImage(response.data.photos);
      setPet(response.data);
      setPetType(response.data.petType);
      setAge(response.data.age);
      setTags(response.data.tags);
      setGender(response.data.gender);
      setName(response.data.petName);
      setCreatorId(response.data.userId);

      const decodedText = new DOMParser().parseFromString(
        `<!doctype html><body>${response.data.petDescription}`,
        'text/html'
      ).body.textContent;

      setDescription(decodedText);
      setLocation(response.data.location);
    } catch (e) {
      console.log('Error Fetching Project', e);
    }
  }, [id]);

  const fetchUser = useCallback(async () => {
    try {
      const response = await getId(creatorId);
      const userData = response.data; // User data from the API
      setCreator(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }, [creatorId]);

  useEffect(() => {
    if (image && image.length > 0) {
      /*  const largeUrlsArray = image.map(photo => photo.large);
      console.log(largeUrlsArray); */
      setLargeImageUrls(image); // Update the state with filtered URLs
    }
  }, [image]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  useEffect(() => {
    if (creatorId) {
      fetchUser();
    }
  }, [creatorId, fetchUser]);

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
                maxW={{ base: '100%', md: '700px' }}
                width={{ base: '100%', md: 'calc(100% - 2rem)' }}
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

                  <Flex justifyContent='space-between'>
                    {petType === 'dog' ? (
                      <>
                        <DogAdoptionModal pet={pet} />
                        <DogSupportModal />
                      </>
                    ) : (
                      <>
                        <CatAdoptionModal pet={name} />
                        <CatSupportModal />
                      </>
                    )}
                  </Flex>
                </Stack>
              </Box>

              <Box
                bg='white'
                p={{ base: 8, md: 16 }}
                rounded='md'
                textAlign='left'
                mx='1rem'
                my={isSmallScreen ? 4 : 10}
                width={{ base: '100%', md: 'calc(50% - 1rem)' }}
              >
                <Box as={'header'}>
                  <Heading
                    lineHeight={1.1}
                    fontWeight={600}
                    fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
                    alignItems='center'
                    divider={<Divider />}
                  >
                    More Info
                  </Heading>
                </Box>
                <Box
                  style={{
                    borderRadius: '1rem',
                    padding: '1rem'
                  }}
                >
                  {creator && (
                    <Friend
                      friendId={creatorId}
                      name={`${creator.firstName} `}
                      subtitle={creator.occupation}
                    />
                  )}
                </Box>
                <Box m='1rem'>
                  <hr />
                </Box>

                <Box mt='2rem'>
                  <LocationMap lng={location.lng} lat={location.lat} />
                </Box>
                <Divider my='8' />
                <Button
                  rounded={'full'}
                  w={'100%'} // Adjust the width to control button size and spacing
                  mt={8}
                  size={'lg'}
                  fontWeight='semibold'
                  py={'7'}
                  bg='#638bf1'
                  color={contactButtonColor}
                  textTransform={'uppercase'}
                  _hover={{
                    transform: 'translateY(2px)',
                    boxShadow: 'lg'
                  }}
                  onClick={() => navigate('/messenger')}
                >
                  Contact
                </Button>
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
              {/*  <HorizontalScrollbar petType={petType} /> */}
            </Box>
          </SimpleGrid>
        ) : (
          <Loading />
        )}
      </Container>
    </>
  );
}
