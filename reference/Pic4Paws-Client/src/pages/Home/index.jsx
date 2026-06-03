import { Box, Typography } from '@mui/material';

import backgroundImage from '../../assets/images/heropic.jpeg';
import './styles.css';
import HeroNav from '../../components/homeBar/HeroNav';
import paw from '../../assets/images/Patinha.png';

export const Home = () => {
  return (
    <>
      <Box
        className='home'
        component='div'
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: 'center',
          backgroundSize: '100%',
          height: '100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative'
        }}
      >
        <HeroNav />
        <Box>
          <Box className='overlap-group'>
            <Typography className='text-wrapper'>
              We are a passionate community of volunteers dedicated to
              celebrating the unique bond between humans and animals through the
              lens of a camera and the power of social media
            </Typography>
            <Box className='overlap' component='div'>
              <Box className='rectangle' component='div' />
              <img
                className='patinhacorao-branca'
                src={paw}
                alt='paw'
                width='30px'
                style={{ paddingLeft: '1rem' }}
              />
              <Typography className='div'>Join Us</Typography>
            </Box>
            <Typography className='pictures-that'>
              <span className='span'>
                Pictures That
                <br />
              </span>
              <span className='text-wrapper-2'>Purrfectly</span>
              <span className='text-wrapper-3'>
                {' '}
                <br />
              </span>
              <span className='span'>Capture The Love</span>
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};
