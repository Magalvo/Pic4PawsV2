import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import LottieModule from 'lottie-react';
import Lot1 from '../lotties/dogKiss.json';
import Img1 from '../assets/images/volu1.png';
import Img2 from '../assets/images/beachHero1.png';
import { resolveComponent } from '../utils/componentInterop.js';

const Lottie = resolveComponent(LottieModule);

const PageComponent = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };
  const isNonMobileScreens = useMediaQuery('(min-width: 1000px)');
  const { palette } = useTheme();
  const medium = palette.neutral.medium;
  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      color={medium}
    >
      <Box
        border='1px none'
        width='90%'
        maxWidth='1440px'
        px={2}
        color={medium}
      >
        <Box py={4} textAlign='center'>
          <Typography
            variant='h1'
            color='textPrimary'
            style={{
              fontSize: '32px',
              fontWeight: 900,
              marginBottom: '2rem'
            }}
          >
            Adopt or Support
          </Typography>
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
          <Typography
            variant='body1'
            color='textPrimary'
            style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '2rem'
            }}
          >
            With us you can find the perfect match with your furry best friend.
            Bring home your best friend after falling in love with their cutest
            photos or in case you can’t take them home you can also support them
            and our shelters to always provide the best care to our furry
            friends. If you become a member, with a symbolic donation you are
            helping us find the perfect family for our cute friends.
          </Typography>
          <Button variant='contained' color='primary' size='large'>
            Explore The Ark →
          </Button>
        </Box>
        <Box py={4} textAlign='center'>
          <Typography
            variant='h1'
            color='textPrimary'
            style={{
              fontSize: '32px',
              fontWeight: 900,
              marginBottom: '2rem'
            }}
          >
            Volunteer To Help
          </Typography>
          <img
            src={Img1}
            alt='volunteer'
            style={{ width: '100%', height: 'auto', marginBottom: '2rem' }}
          />
          <Typography
            variant='body1'
            color='textPrimary'
            style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '2rem'
            }}
          >
            Volunteer with us and earn Paws®. When you volunteer at one of our
            events or at one of our shelters you are also earning Paws that you
            can later be spent helping one of our sheltered dogs or even
            exchanged for one of our merchandising items that are always
            supporting our shelters.
          </Typography>
          <Button variant='contained' color='primary' size='large'>
            Volunteer →
          </Button>
        </Box>
        <Box py={4} textAlign='center'>
          <Typography
            variant='h1'
            color='textPrimary'
            style={{
              fontSize: '32px',
              fontWeight: 900,
              marginBottom: '2rem'
            }}
          >
            Create Memories
          </Typography>
          <img
            src={Img2}
            alt='Memories'
            style={{ width: '100%', height: 'auto', marginBottom: '2rem' }}
          />
          <Typography
            variant='body1'
            color='textPrimary'
            style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '2rem'
            }}
          >
            We know you love your best friend. That&apos;s why we have a diverse
            collection of souvenirs from mugs to T-Shirts that you can
            personalize with the pictures of your best friend. And of course, by
            doing that, you are always supporting us.
          </Typography>
          <Button variant='contained' color='primary' size='large'>
            Explore Memories Section →
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PageComponent;
