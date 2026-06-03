import ManageAccountsOutlinedModule from '@mui/icons-material/ManageAccountsOutlined';
import EditOutlinedModule from '@mui/icons-material/EditOutlined';
import LocationOnOutlinedModule from '@mui/icons-material/LocationOnOutlined';
import WorkOutlineOutlinedModule from '@mui/icons-material/WorkOutlineOutlined';

import { Box, Typography, Divider, useTheme } from '@mui/material';
import WidgetWrapper from '../../components/WidgetWrapper';
import { useSelector } from 'react-redux';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FlexBetween from '../../components/flexBetween';
import UserImage from '../../components/userImage';
import { getId } from '../../api/users.api';
import Loading from '../../components/Loading';
import { resolveComponent } from '../../utils/componentInterop.js';
import { AuthContext } from '../../context/auth.context.jsx';
import { GUEST_USER_ID, guestUser } from '../../data/guestDemo.js';

const ManageAccountsOutlined = resolveComponent(ManageAccountsOutlinedModule);
const EditOutlined = resolveComponent(EditOutlinedModule);
const LocationOnOutlined = resolveComponent(LocationOnOutlinedModule);
const WorkOutlineOutlined = resolveComponent(WorkOutlineOutlinedModule);

 
const UserWidget = () => {
  const [user, setUser] = useState(null);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const { isGuest } = useContext(AuthContext);
  const authToken = useSelector(state => state.authToken);
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;
  const userId = isGuest ? GUEST_USER_ID : localStorage.getItem('userId');

  const getUser = async () => {
    if (isGuest) {
      setUser(guestUser);
      return;
    }

    const response = await getId(userId);
    const data = response.data;
    setUser(data);
  };

  useEffect(() => {
    getUser();
  }, [userId, authToken, isGuest]); //eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return <Loading />;
  }

  return (
    <WidgetWrapper>
      {/* Header Section */}
      <Box
        onClick={() => {
          if (!isGuest) navigate(`/profile/${userId}`);
        }}
        sx={{
          cursor: !isGuest ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': !isGuest ? {
            transform: 'translateY(-2px)'
          } : {}
        }}
      >
        <FlexBetween gap='1rem' pb='1.5rem'>
          <FlexBetween gap='1rem'>
            <UserImage userId={userId} />
            <Box>
              <Typography
                variant='h5'
                color={dark}
                fontWeight='700'
                sx={{
                  letterSpacing: '-0.5px',
                  '&:hover': !isGuest ? {
                    color: palette.primary.main
                  } : {}
                }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              <Typography color={medium} sx={{ fontSize: '0.85rem', mt: '0.2rem' }}>Pic4Paws Member</Typography>
            </Box>
          </FlexBetween>
          {!isGuest && <ManageAccountsOutlined sx={{ color: main, cursor: 'pointer' }} />}
        </FlexBetween>
      </Box>

      <Divider sx={{ my: '1rem' }} />

      {/* Location & Occupation */}
      <Box sx={{ mb: '1.5rem' }}>
        <Box display='flex' alignItems='center' gap='1rem' mb='1rem'>
          <LocationOnOutlined sx={{ color: palette.primary.main, fontSize: '1.3rem' }} />
          <Box>
            <Typography variant='caption' color={medium} sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</Typography>
            <Typography color={dark} fontWeight='500'>{user.location}</Typography>
          </Box>
        </Box>
        <Box display='flex' alignItems='center' gap='1rem'>
          <WorkOutlineOutlined sx={{ color: palette.primary.main, fontSize: '1.3rem' }} />
          <Box>
            <Typography variant='caption' color={medium} sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Occupation</Typography>
            <Typography color={dark} fontWeight='500'>{user.occupation}</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: '1rem' }} />
      
      {/* Stats Section */}
      <Box sx={{ mb: '1.5rem' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem'
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${palette.primary.main}10 0%, ${palette.primary.light}10 100%)`,
              padding: '1rem',
              borderRadius: '0.75rem',
              textAlign: 'center',
              border: `1px solid ${palette.primary.main}20`
            }}
          >
            <Typography color={palette.primary.main} fontWeight='700' variant='h5'>
              {user.viewedProfile}
            </Typography>
            <Typography color={medium} variant='caption' sx={{ fontSize: '0.75rem' }}>
              Profile Views
            </Typography>
          </Box>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${palette.success.main}10 0%, ${palette.success.light}10 100%)`,
              padding: '1rem',
              borderRadius: '0.75rem',
              textAlign: 'center',
              border: `1px solid ${palette.success.main}20`
            }}
          >
            <Typography color={palette.success.main} fontWeight='700' variant='h5'>
              {user.impressions}
            </Typography>
            <Typography color={medium} variant='caption' sx={{ fontSize: '0.75rem' }}>
              Post Impressions
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: '1rem' }} />

      {/* Social Profiles */}
      <Box>
        <Typography fontSize='0.85rem' color={main} fontWeight='700' mb='1rem' sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Social Profiles
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <FlexBetween
            gap='1rem'
            sx={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${palette.primary.main}10`
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Box
                component='img'
                src='../assets/twitter.png'
                alt='twitter'
                sx={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <Box>
                <Typography color={main} fontWeight='600' sx={{ fontSize: '0.9rem' }}>
                  Twitter
                </Typography>
                <Typography color={medium} sx={{ fontSize: '0.75rem' }}>Social Network</Typography>
              </Box>
            </Box>
            <EditOutlined sx={{ color: palette.primary.main, cursor: 'pointer', fontSize: '1.2rem' }} />
          </FlexBetween>
          <FlexBetween
            gap='1rem'
            sx={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: `${palette.primary.main}10`
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Box
                component='img'
                src='../assets/linkedin.png'
                alt='linkedin'
                sx={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <Box>
                <Typography color={main} fontWeight='600' sx={{ fontSize: '0.9rem' }}>
                  Linkedin
                </Typography>
                <Typography color={medium} sx={{ fontSize: '0.75rem' }}>Professional Network</Typography>
              </Box>
            </Box>
            <EditOutlined sx={{ color: palette.primary.main, cursor: 'pointer', fontSize: '1.2rem' }} />
          </FlexBetween>
        </Box>
      </Box>
    </WidgetWrapper>
  );
};

export default UserWidget;
