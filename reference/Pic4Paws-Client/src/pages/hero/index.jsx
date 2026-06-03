import { Box, Typography, useMediaQuery, Button } from '@mui/material';
import './styles.css';
import Paw from '../../assets/images/Patinha.png';
import HomeNav from '../../components/HomeNav';
import backgroundImage from '../../assets/images/heroPic2.jpg';
import { useNavigate } from 'react-router-dom';
import WhoAreWe from '../../components/whoAreWe.jsx';
import Mission from '../../components/Mission.jsx';

const Hero = () => {
  const isNonMobileScreens = useMediaQuery('(min-width: 1000px)');
  const navigate = useNavigate();
  return (
    <>
      <Box
        className='hero'
        component='div'
        width='100%'
        height='100%'
        sx={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <HomeNav flex='none' />
        <Box
          display='flex'
          flexDirection={isNonMobileScreens ? 'row' : 'column'}
          alignItems={isNonMobileScreens ? 'left' : 'center'}
          justifyContent={isNonMobileScreens ? 'left' : 'center'}
          padding={isNonMobileScreens ? '10rem 6.5%' : '2.5rem 4%'}
          backgroundColor={
            isNonMobileScreens ? undefined : 'RGB(255,255,255,30%)'
          }
          borderRadius='40px'
        >
          <Box
            flexBasis={isNonMobileScreens ? '60%' : undefined}
            textAlign={isNonMobileScreens ? 'left' : 'center'}
            alignItems={isNonMobileScreens ? 'left' : 'center'}
          >
            <Typography className='pictures-that'>
              <span className='span'>
                Pictures That
                <br />
              </span>
              <span className='text-wrapper-2'>Purrfectly</span>
              <span className='text-wrapper-3'>
                <br />
              </span>
              <span className='span'>Capture The Love</span>
            </Typography>
            <Typography
              alignContent={isNonMobileScreens ? undefined : 'center'}
              className='text-wrapper'
              width={isNonMobileScreens ? '50%' : '100%'}
              fontSize={isNonMobileScreens ? '20px' : '15px'}
              //textAlign={isNonMobileScreens ? undefined : 'center'}
            >
              We are a passionate community of volunteers dedicated to
              celebrating the unique bond between humans and animals through the
              lens of a camera and the power of social media
            </Typography>
            <Button
              flex={isNonMobileScreens ? 'flex' : 'none'}
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
                marginTop: '3rem',
                transition: 'background-color 0.3s',
                '&:hover': {
                  backgroundColor: '#638BF1'
                }
              }}
              onClick={() => navigate('/auth')}
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
                Join Us
              </Typography>
              {'    '}
              <img
                src={Paw}
                alt='paw'
                width='37rem'
                style={{ paddingLeft: '1rem' }}
              />
            </Button>
          </Box>
        </Box>
      </Box>

      <WhoAreWe marginTop='5rem' />
      <Mission />
    </>
  );
};

export default Hero;
