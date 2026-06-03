import { useState, useEffect } from 'react';
import { AppBar, Typography, Box } from '@mui/material';

import './styles.css';

export const HomeNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.pageYOffset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AppBar
      position='fixed'
      className={scrolled ? 'navbar scrolled' : 'navbar'}
      sx={{ transition: '0.32s ease-in-out' }}
    >
      <Box className='div'>
        <img className='title-head' alt='Title head' src='title-head-2.png' />
        <Box className='overlap-group'>
          <Box className='rectangle' />
          <img
            className='patinhacorao-branca'
            alt='Patinhacorao branca'
            src='patinhacora-o-branca-7.png'
          />
          <Typography variant='body1' className='text-wrapper'>
            Sign Up
          </Typography>
        </Box>
        <Typography variant='body1' className='text-wrapper-2'>
          About Us
        </Typography>
        <Typography variant='body1' className='text-wrapper-3'>
          Our Mission
        </Typography>
        <Typography variant='body1' className='text-wrapper-4'>
          Adopt 4 Paws
        </Typography>
      </Box>
    </AppBar>
  );
};
