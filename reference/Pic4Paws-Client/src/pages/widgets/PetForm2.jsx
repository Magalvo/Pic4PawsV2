import { Formik } from 'formik';
import { Box, Typography } from '@mui/material';
import MapComponent from '../../components/GoogleMaps';

const initialValues = {
  petDescription: '',
  pictures: [],
  petName: '',
  petType: '',
  primaryBreed: '',
  secondaryBreed: '',
  tags: [],
  gender: '',
  age: ''
};

const PetForm = () => {
  return (
    <Formik onSubmit={() => {}} initialValues={initialValues}>
      {({ handleSubmit }) => (
        <Box>
          <Typography
            variant='h5'
            color='#638bf1'
            textAlign='center'
            fontWeight='bold'
            fontSize='2rem'
            mb='1rem'
          >
            Create a New 4 Paws
          </Typography>
          <form onSubmit={handleSubmit}>
            <MapComponent />
          </form>
        </Box>
      )}
    </Formik>
  );
};

export default PetForm;
