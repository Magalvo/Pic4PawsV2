import UserWidget from '../../pages/widgets/UserWidget';
import NavBar from '../navBar/index';
import { Box, useMediaQuery, Typography, useTheme } from '@mui/material';
import MyPostWidget from '../../pages/widgets/MyPostWidget';
import AdvertWidget from '../../pages/widgets/AdvertWidget';
import FriendListWidget from '../../pages/widgets/FriendListWidget';
import PostsWidget from '../../pages/widgets/PostsWidget';
import { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { findEmail } from '../../api/users.api';
import { AuthContext } from '../../context/auth.context.jsx';
import { GUEST_USER_ID, guestUser } from '../../data/guestDemo.js';

const HomePage = () => {
  const isNonMobileScreens = useMediaQuery('(min-width:1000px)');
  const { isGuest } = useContext(AuthContext);
  const userId = isGuest ? GUEST_USER_ID : localStorage.getItem('userId');
  const userEmail = useSelector(state => state.user?.email);
  const stateUser = useSelector(state => state.user);
  const { palette } = useTheme();

  useEffect(() => {
    if (isGuest || !userEmail) return;

    const findByEmail = async () => {
      const user = await findEmail(userEmail);
      const response = user.data;

      localStorage.setItem('UserIds', response._id);
    };

    findByEmail();
  }, [isGuest, userEmail]);

  const displayUser = isGuest ? guestUser : stateUser;
  const welcomeMessage = isGuest 
    ? `Welcome to Pic4Paws, ${displayUser?.firstName || 'Guest'}!` 
    : `Welcome back, ${displayUser?.firstName || 'User'}!`;

  return (
    <Box>
      <NavBar userId={userId} />
      
      {/* Welcome Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${palette.primary.main}15 0%, ${palette.primary.light}15 100%)`,
          borderBottom: `2px solid ${palette.primary.light}`,
          padding: '2rem 6%',
          mb: '2rem'
        }}
      >
        <Typography
          variant='h3'
          sx={{
            fontWeight: 700,
            color: palette.primary.main,
            mb: '0.5rem',
            letterSpacing: '-0.5px'
          }}
        >
          {welcomeMessage}
        </Typography>
        <Typography
          variant='body1'
          sx={{
            color: palette.neutral.medium,
            fontSize: '1rem'
          }}
        >
          {isGuest ? 'Explore pets for adoption or share your experience' : 'Share, connect, and help pets find their forever homes'}
        </Typography>
      </Box>

      <Box
        width='100%'
        padding='0 6%'
        display={isNonMobileScreens ? 'flex' : 'block'}
        gap='2rem'
        justifyContent='space-between'
      >
        <Box flexBasis={isNonMobileScreens ? '26%' : undefined}>
          <UserWidget userId={userId} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? '42%' : undefined}
          mt={isNonMobileScreens ? undefined : '2rem'}
        >
          {!isGuest && <MyPostWidget />}
          <PostsWidget userId={userId} />
        </Box>
        {isNonMobileScreens && (
          <Box flexBasis='26%'>
            <AdvertWidget />
            <Box m='2rem 0' />
            <FriendListWidget userId={userId} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;
