import { useCallback, useEffect, useState } from 'react';
import { getApiPets } from '../api/apiPets.api';
import PetCard from '../pages/widgets/petApiWidget/petApiWidget';

const HorizontalScrollbar = ({ petType }) => {
  const type = petType;
  const [pets, setPets] = useState([]);
  const fetchPetType = useCallback(async () => {
    try {
      const response = await getApiPets({ type });
      setPets(Array.isArray(response.data?.animals) ? response.data.animals : []);
    } catch (error) {
      console.error('Error fetching Petfinder pets', error);
      setPets([]);
    }
  }, [type]);

  useEffect(() => {
    fetchPetType();
  }, [fetchPetType]);

  return (
    <div
      style={{
        backgroundColor: '#638bf1',
        overflowX: 'scroll',
        whiteSpace: 'nowrap'
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        {pets.map(pet => (
          <div key={pet.id} style={{ minWidth: '300px' }}>
            <PetCard pet={pet} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalScrollbar;
