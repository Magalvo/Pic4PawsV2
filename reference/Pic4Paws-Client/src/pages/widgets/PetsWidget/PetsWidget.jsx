import { useContext, useEffect, useState } from 'react';
import { getPets } from '../../../api/pets.api';
import { getApiPets } from '../../../api/apiPets.api';
import { getCatImages, getDogImages } from '../../../api/breeds.api';
import PetWidget from '../petWidget/PetWidget';
import { Grid } from '@mui/material';
import './Styles.css';
import PetApiWidget from '../../widgets/petApiWidget/petApiWidget';
import FormAccordion from '../../../components/Accordion';
import { AuthContext } from '../../../context/auth.context';
import {
  GUEST_ADOPTION_STORAGE_KEY,
  buildGuestAdoptionPets
} from '../../../data/guestAdoptionDemo.js';

const PetsWidget = () => {
  const [pets, setPets] = useState([]);
  const [apiPets, setApiPets] = useState([]);
  const [guestPets, setGuestPets] = useState([]);
  const { isGuest } = useContext(AuthContext);

  //________________________________ PET FINDER API PETS_______________________________//
  const fetchPets = async () => {
    try {
      const response = await getApiPets();
      setApiPets(Array.isArray(response.data?.animals) ? response.data.animals : []);
      return response.data;
    } catch (error) {
      console.error('Error fetching Petfinder pets', error);
      setApiPets([]);
    }
  };

  useEffect(() => {
    if (!isGuest) {
      fetchPets();
    }
  }, [isGuest]);

  //________________________________ MY API PETS_______________________________________//
  const fetchMyPets = async () => {
    try {
      const response = await getPets();

      setPets(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      console.error('Error fetching pets', e);
      setPets([]);
    }
  };

  useEffect(() => {
    if (!isGuest) {
      fetchMyPets();
    }
  }, [isGuest]);

  const fetchGuestPets = async () => {
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

      const pets = buildGuestAdoptionPets(catImages, dogImages);
      setGuestPets(pets);
      sessionStorage.setItem(GUEST_ADOPTION_STORAGE_KEY, JSON.stringify(pets));
    } catch (error) {
      console.error('Error fetching guest adoption pets', error);
      const pets = buildGuestAdoptionPets([], []);
      setGuestPets(pets);
      sessionStorage.setItem(GUEST_ADOPTION_STORAGE_KEY, JSON.stringify(pets));
    }
  };

  useEffect(() => {
    if (isGuest) {
      fetchGuestPets();
    }
  }, [isGuest]);

  const refreshList = () => {
    fetchMyPets();
  };

  return (
    <>
      <Grid item xs={12} sm={7}>
        <div>
          <h1>Pets</h1>
          {isGuest ? (
            <Grid
              sx={{ display: 'flex', alignItem: 'center' }}
              container
              alignItems='stretch'
              spacing={3}
            >
              {guestPets.map(pet => (
                <Grid item key={pet.id} xs={12} sm={6} md={6}>
                  <PetApiWidget pet={pet} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              <Grid
                sx={{ display: 'flex', alignItem: 'center' }}
                container
                alignItems='stretch'
                spacing={3}
              >
                {pets.map(pet => (
                  <Grid item key={pet._id} xs={12} sm={6} md={6}>
                    <PetWidget pet={pet} />
                  </Grid>
                ))}
              </Grid>
              <Grid
                sx={{ display: 'flex', alignItem: 'center' }}
                container
                alignItems='stretch'
                spacing={3}
              >
                {apiPets.map(pet => (
                  <Grid item key={pet.id} xs={12} sm={6} md={6}>
                    <PetApiWidget pet={pet} />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </div>
      </Grid>
      {!isGuest && (
        <Grid item xs={12} sm={4}>
          <FormAccordion refreshList={refreshList} />
        </Grid>
      )}
    </>
  );
};

export default PetsWidget;
