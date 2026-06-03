import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  CssBaseline,
  Paper,
  ThemeProvider
} from '@mui/material';
import Form from './Form';
import Logo from '../../assets/images/logiz.png';
import { Link, useNavigate } from 'react-router-dom';
import Image from '../../assets/images/FormPic.webp';

function Copyright() {
  return (
    <Typography variant='body2' color='text.secondary' align='center'>
      {'Copyright © '}
      <Link color='inherit' href='https://pic4paws.com'>
        Pic4Paws
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const LoginPage = () => {
  const isNonMobileScreens = useMediaQuery('(min-width: 1000px)');
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <Grid container component='main' sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: `url(${Image})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <Grid
          item
          xs={12}
          sm={8}
          component={Paper}
          md={5}
          elevation={6}
          backgroundColor='#638bF1'
        >
          <Box
            width={isNonMobileScreens ? '75%' : '93%'}
            m='2rem auto'
            borderRadius='1.5rem'
            backgroundColor='' //{theme.palette.background.alt}
          >
            <Box
              width='100%'
              display='flex'
              justifyContent='center' // Center the content horizontally
              alignItems='center'
              backgroundColor='white'
              borderRadius='60px'
              onClick={() => navigate('/')}
            >
              <img src={Logo} alt='pic4paws' width='200' />
            </Box>
            <Typography
              fontWeight='500'
              variant='h5'
              sx={{ mb: '1.5rem' }}
              textAlign='center'
              color='white'
            >
              Enroll On This Pawsome Adventure
            </Typography>
            <Form />
            <Copyright sx={{ mt: 5 }} />
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default LoginPage;
