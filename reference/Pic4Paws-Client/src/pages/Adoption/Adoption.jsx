import { Container, Grow, Grid, Typography } from '@mui/material';

import PetsWidget from '../widgets/PetsWidget/PetsWidget';
import './Styles.css';

import Navbar from '../navBar/index';

const Adoption = () => {
  return (
    <>
      <Navbar />
      <Grow in>
        <Container>
          <Typography variant='h2' color='inherit' align='center'>
            Adopt a 4 Paws
          </Typography>
          <Grid
            className='gridContainer'
            container
            direction='column-reverse'
            justify-content='space-between'
            alignItems='stretch'
            spacing={3}
          >
            <PetsWidget />
          </Grid>
        </Container>
      </Grow>
    </>
  );
};

export default Adoption;
