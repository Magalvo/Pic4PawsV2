import { Box, Typography, Button, Grid, useMediaQuery } from '@mui/material';
import LottieModule from 'lottie-react';
import { useNavigate } from 'react-router-dom';
import Lot1 from '../lotties/dogBox.json';
import Lot2 from '../lotties/dogPet.json';
import Lot3 from '../lotties/catCamera.json';
import paw from '../assets/images/Patinha.png';
import { resolveComponent } from '../utils/componentInterop.js';

const Lottie = resolveComponent(LottieModule);

const WhoAreWe = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };
  const navigate = useNavigate();
  const isNonMobileScreens = useMediaQuery('(min-width: 1000px)');
  return (
    <Box
      bgcolor='#638BF1'
      minHeight='100vh'
      display='flex'
      flexDirection='column'
      justifyContent='space-around'
    >
      <Box textAlign='center' padding='2rem'>
        <Typography variant='h3' fontWeight='bold'>
          Get To Know our Culture
        </Typography>
        <Typography
          variant='h1'
          fontSize='5rem'
          fontWeight='bold'
          color='#1e3156'
        >
          Who Are We
        </Typography>
      </Box>
      <Grid
        container
        justifyContent='space-around'
        spacing={4}
        style={{ padding: '2rem' }}
      >
        <Grid item xs={12} sm={4}>
          <Box textAlign='center'>
            <Box
              className='animation'
              height={isNonMobileScreens ? '600px' : '300px'}
              width={isNonMobileScreens ? '600px' : '300px'}
              style={{
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <Lottie
                options={defaultOptions}
                animationData={Lot1}
                height={600}
                width={600}
              />
            </Box>
            <Typography variant='h2' fontWeight='bold' color='#1e3156'>
              Our Mission
            </Typography>
            <Typography
              variant='body1'
              fontWeight='bold'
              fontSize='1rem'
              style={{
                color: 'white',
                position: 'relative',
                width: ' 70%',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              Our mission is to showcase the captivating stories and
              personalities of our furry friends, while raising awareness about
              animal welfare and promoting pet adoption. We aim to create a
              visual platform where the magic and essence of each animal can
              shine through.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box textAlign='center'>
            <Box
              className='animation'
              height={isNonMobileScreens ? '600px' : '300px'}
              width={isNonMobileScreens ? '600px' : '300px'}
              style={{
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <Lottie
                options={defaultOptions}
                animationData={Lot2}
                height={200}
                width={200}
              />
            </Box>
            <Typography variant='h2' fontWeight='bold' color='#1e3156'>
              How We Make a Difference
            </Typography>
            <Typography
              variant='body1'
              fontSize='1rem'
              fontWeight='bold'
              style={{
                position: 'relative',
                width: ' 70%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white'
              }}
            >
              By sharing these captivating images, we aim to touch the hearts of
              potential adopters, inspiring them to welcome a deserving pet into
              their lives. Additionally, we collaborate with animal advocacy
              groups and organize fundraising events to support animal shelters,
              veterinary care, and spay/neuter programs, ensuring a brighter
              future for our furry companions.
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box textAlign='center'>
            <Box
              className='animation'
              alignItems='center'
              height={isNonMobileScreens ? '600px' : '300px'}
              width={isNonMobileScreens ? '600px' : '300px'}
              style={{
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <Lottie
                options={defaultOptions}
                animationData={Lot3}
                height={600}
                width={600}
              />
            </Box>
            <Typography variant='h2' fontWeight='bold' color='#1e3156'>
              What We Do
            </Typography>
            <Typography
              variant='body1'
              fontWeight='bold'
              fontSize='1rem'
              style={{
                color: 'white',
                position: 'relative',
                width: ' 70%',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              We collaborate with animal shelters, rescue organizations, and pet
              owners to capture heartwarming and vibrant photographs of animals
              in need of forever homes. Through our lens, we capture the
              unconditional love, playfulness, and joy that our four-legged
              friends bring to our lives.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box textAlign='center' paddingBottom='2rem' width='100%'>
        <Button
          sx={{
            justifySelf: 'center',
            backgroundColor: '#6bbb52',
            border: '1px solid #65915733',
            borderRadius: '23.5px',
            boxShadow: '0px 4px 4px #00000040',
            height: '48px',
            width: '168px',
            alignItems: 'center',

            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            '&:hover': {
              backgroundColor: '#638BF1'
            }
          }}
          onClick={() => navigate('/')}
        >
          <Typography
            variant='h6'
            sx={{
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: 0,
              textShadow: '0px 4px 4px #00000040',
              whiteSpace: 'nowrap'
            }}
          >
            Explore
          </Typography>

          <img
            src={paw}
            alt='paw'
            width='37rem'
            style={{ paddingLeft: '1rem' }}
          />
        </Button>
      </Box>
    </Box>
  );
};

export default WhoAreWe;
