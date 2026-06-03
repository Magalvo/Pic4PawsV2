import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  List,
  ListItem,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../navBar/index';
import Carrousel from '../../../components/ImageSlider';
import Loading from '../../../components/Loading';
import {
  GUEST_ADOPTION_STORAGE_KEY,
  buildGuestAdoptionPets,
  readStoredGuestAdoptionPets
} from '../../../data/guestAdoptionDemo.js';
import { getCatImages, getDogImages } from '../../../api/breeds.api';

const GuestPetDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [pet, setPet] = useState(location.state?.pet || null);
  const [isLoading, setIsLoading] = useState(!location.state?.pet);

  const cardBackground = useColorModeValue('white', 'gray.900');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  const imageCards = useMemo(() => {
    const imageUrls = [
      pet?.primary_photo_cropped?.medium,
      ...(pet?.photos || []).map(photo => photo.large || photo.medium || photo.small)
    ].filter(Boolean);

    return imageUrls.length > 0 ? imageUrls : [];
  }, [pet]);

  useEffect(() => {
    const storedPet = readStoredGuestAdoptionPets().find(candidate => candidate.id === id);

    if (storedPet) {
      setPet(storedPet);
      setIsLoading(false);
      return;
    }

    if (location.state?.pet?.id === id) {
      setPet(location.state.pet);
      setIsLoading(false);
      return;
    }

    const fetchGuestPet = async () => {
      try {
        const [catResponse, dogResponse] = await Promise.all([
          getCatImages({ limit: 3 }),
          getDogImages({ limit: 3 })
        ]);

        const catImages = Array.isArray(catResponse.data)
          ? catResponse.data.map(item => item.url).filter(Boolean)
          : [];
        const dogImages = Array.isArray(dogResponse.data)
          ? dogResponse.data.map(item => item.url).filter(Boolean)
          : [];

        const generatedPets = buildGuestAdoptionPets(catImages, dogImages);
        sessionStorage.setItem(
          GUEST_ADOPTION_STORAGE_KEY,
          JSON.stringify(generatedPets)
        );

        const match = generatedPets.find(candidate => candidate.id === id) || null;
        setPet(match);
      } catch (error) {
        console.error('Error loading guest pet details', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuestPet();
  }, [id, location.state]);

  if (isLoading) {
    return <Loading />;
  }

  if (!pet) {
    return (
      <>
        <Navbar />
        <Container maxW='6xl' py={12}>
          <Box bg={cardBackground} borderRadius='2xl' p={10} boxShadow='lg'>
            <Heading size='lg' mb={4}>
              Pet demo not found
            </Heading>
            <Text color={mutedTextColor} mb={6}>
              This guest adoption profile is not available in the current demo session.
            </Text>
            <Button colorScheme='blue' onClick={() => navigate('/pets')}>
              Back to adoption
            </Button>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box bg='linear-gradient(180deg, #f7fbff 0%, #eef5ff 100%)' minH='100vh'>
        <Container maxW='7xl' py={{ base: 6, md: 10 }}>
          <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={8}>
            <Box borderRadius='3xl' overflow='hidden' boxShadow='2xl'>
              <Carrousel cards={imageCards.length > 0 ? imageCards : [pet.primary_photo_cropped?.medium]} />
            </Box>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} alignItems='start'>
              <Box
                gridColumn={{ base: 'auto', lg: 'span 2' }}
                bg={cardBackground}
                borderRadius='3xl'
                p={{ base: 6, md: 10 }}
                boxShadow='xl'
              >
                <HStack spacing={3} mb={4} flexWrap='wrap'>
                  <Badge colorScheme='blue' px={3} py={1} borderRadius='full'>
                    Guest Demo
                  </Badge>
                  <Badge colorScheme='green' px={3} py={1} borderRadius='full'>
                    Ready for adoption
                  </Badge>
                  <Badge colorScheme='orange' px={3} py={1} borderRadius='full'>
                    {pet.type}
                  </Badge>
                </HStack>

                <Heading size='2xl' mb={3}>
                  {pet.name}
                </Heading>

                <Text fontSize='lg' color={mutedTextColor} mb={6}>
                  {pet.gender} · {pet.age} · {pet.location}
                </Text>

                <Stack spacing={6} divider={<Divider borderColor='gray.200' />}>
                  <Box>
                    <Text fontSize='md' color={mutedTextColor} mb={3}>
                      {pet.description}
                    </Text>
                    <HStack spacing={2} flexWrap='wrap'>
                      {pet.tags.map(tag => (
                        <Badge key={tag} colorScheme='cyan' variant='subtle' px={3} py={1} borderRadius='full'>
                          #{tag}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>

                  <Box>
                    <Text fontSize='lg' fontWeight='700' mb={3}>
                      Adoption profile
                    </Text>
                    <List spacing={3}>
                      <ListItem>
                        <Text as='span' fontWeight='700'>Primary breed:</Text> {pet.breeds.primary}
                      </ListItem>
                      <ListItem>
                        <Text as='span' fontWeight='700'>Secondary breed:</Text>{' '}
                        {pet.breeds.secondary || 'None'}
                      </ListItem>
                      <ListItem>
                        <Text as='span' fontWeight='700'>Mixed:</Text> {pet.breeds.mixed ? 'Yes' : 'No'}
                      </ListItem>
                      <ListItem>
                        <Text as='span' fontWeight='700'>Session note:</Text> This is a generated guest adoption profile.
                      </ListItem>
                    </List>
                  </Box>
                </Stack>
              </Box>

              <Box
                bg={cardBackground}
                borderRadius='3xl'
                p={{ base: 6, md: 8 }}
                boxShadow='xl'
              >
                <Text fontSize='sm' fontWeight='700' letterSpacing='wide' color='blue.600' mb={2}>
                  What you can do
                </Text>
                <Heading size='md' mb={4}>
                  Explore the demo as a guest
                </Heading>
                <Text color={mutedTextColor} mb={6}>
                  Guest mode shows mock pets only. You can browse the details and preview the adoption flow without creating or saving a real listing.
                </Text>
                <Stack spacing={3}>
                  <Button colorScheme='blue' onClick={() => navigate('/pets')}>
                    Back to adoption
                  </Button>
                  <Button variant='outline' onClick={() => navigate(-1)}>
                    Go back
                  </Button>
                </Stack>
              </Box>
            </SimpleGrid>
          </SimpleGrid>
        </Container>
      </Box>
    </>
  );
};

export default GuestPetDetails;