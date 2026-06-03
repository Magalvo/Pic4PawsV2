import { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import DarkModeModule from '@mui/icons-material/DarkMode';
import LightModeModule from '@mui/icons-material/LightMode';
import MenuModule from '@mui/icons-material/Menu';
import CloseModule from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import { setMode } from '../../state/index.js';
import { NavLink, useNavigate } from 'react-router-dom';
import FlexBetween from '../../components/flexBetween.jsx';
import Logo from '../../assets/images/logiz.png';
import paw from '../../assets/images/Patinha.png';
import { resolveComponent } from '../../utils/componentInterop.js';

const DarkMode = resolveComponent(DarkModeModule);
const LightMode = resolveComponent(LightModeModule);
const Menu = resolveComponent(MenuModule);
const Close = resolveComponent(CloseModule);
const HeroNav = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isNonMobileScreens = useMediaQuery('(min-width: 1000px)');

  const theme = useTheme();

  const dark = theme.palette.neutral.dark;

  return (
    <FlexBetween padding='1rem 6%' backgroundColor='transparent'>
      <FlexBetween gap='1.75rem'>
        <Box>
          <img src={Logo} alt='pic4paws' style={{ width: '200px' }} />
        </Box>
      </FlexBetween>

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <FlexBetween gap='2rem'>
          <NavLink
            to='/pets'
            style={{ textDecoration: 'none', color: 'white' }}
          >
            Adopt
          </NavLink>
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === 'dark' ? (
              <DarkMode sx={{ fontSize: '25px' }} />
            ) : (
              <LightMode sx={{ color: dark, fontSize: '25px' }} />
            )}
          </IconButton>

          <Box
            sx={{
              backgroundColor: '#6bbb52',
              border: '1px solid #65915733',
              borderRadius: '23.5px',
              boxShadow: '0px 4px 4px #00000040',
              height: '48px',
              width: '168px',
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/auth')}
          >
            <Typography
              variant='h6'
              sx={{
                color: '#ffffff',
                fontFamily: 'Inter-Bold, Helvetica',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: 0,
                textShadow: '0px 4px 4px #00000040',
                whiteSpace: 'nowrap'
              }}
            >
              Sign Up
            </Typography>
            {'    '}
            <img
              src={paw}
              alt='paw'
              width='37rem'
              style={{ paddingLeft: '1rem' }}
            />
          </Box>
        </FlexBetween>
      ) : (
        <IconButton
          onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
        >
          <Menu />
        </IconButton>
      )}

      {/* MOBILE NAV */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          position='fixed'
          right='0'
          bottom='0'
          height='100%'
          zIndex='10'
          maxWidth='500px'
          minWidth='300px'
        >
          {/* CLOSE ICON */}
          <Box display='flex' justifyContent='flex-end' p='1rem'>
            <IconButton
              onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
            >
              <Close />
            </IconButton>
          </Box>

          {/* MENU ITEMS */}
          <FlexBetween
            display='flex'
            flexDirection='column'
            justifyContent='center'
            alignItems='center'
            gap='3rem'
          >
            <IconButton
              onClick={() => dispatch(setMode())}
              sx={{ fontSize: '25px' }}
            >
              {theme.palette.mode === 'dark' ? (
                <DarkMode sx={{ fontSize: '25px' }} />
              ) : (
                <LightMode sx={{ color: dark, fontSize: '25px' }} />
              )}
            </IconButton>

            <Typography
              fontWeight='normal'
              fontSize='clamp(0.25rem, 0.75rem, 1rem)' // Adjust the font size as per your requirement
              color='primary'
              onClick={() => navigate('/auth')}
              sx={{
                backgroundColor: '#6bbb52',
                color: 'white',
                padding: '0.5rem 1rem', // Adjust the padding as per your requirement
                borderRadius: '30px', // Adjust the border radius as per your requirement
                width: '5rem', // Adjust the width as per your requirement
                height: '30px', // Adjust the height as per your requirement
                cursor: 'pointer',
                alignItems: 'center'
              }}
            >
              Sign Up
            </Typography>
          </FlexBetween>
        </Box>
      )}
    </FlexBetween>
  );
};
export default HeroNav;
