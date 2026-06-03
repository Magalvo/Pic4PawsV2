import { Box, useMediaQuery } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NavBar from '../../pages/navBar/index';
import FriendListWidget from '../../pages/widgets/FriendListWidget';
import MyPostWidget from '../../pages/widgets/MyPostWidget';
import PostsWidget from '../../pages/widgets/PostsWidget';
import UserWidget from '../../pages/widgets/UserWidget';
import { getId } from '../../api/users.api';
import Loading from '../../components/Loading';
import { AuthContext } from '../../context/auth.context.jsx';
import { GUEST_USER_ID, guestUser } from '../../data/guestDemo.js';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const { isGuest } = useContext(AuthContext);
  const params = useParams();
  const userId = isGuest ? GUEST_USER_ID : params.userId;
  const isNonMobileScreens = useMediaQuery('(min-width: 1000px)');

  useEffect(() => {
    if (isGuest) {
      setUser(guestUser);
      setUserImage(guestUser.imgUrl);
      return;
    }

    const getUser = async () => {
      const response = await getId(userId);
      const data = response.data;
      setUser(data);
      setUserImage(data.imgUrl);
    };
    getUser();
  }, [isGuest, userId]); // Fetch user details whenever userId changes

  if (!user) return <Loading />;

  return (
    <Box>
      <NavBar />
      <Box
        width='100%'
        padding='2rem 6%'
        display={isNonMobileScreens ? 'flex' : 'block'}
        gap='2rem'
        justifyContent='center'
      >
        <Box flexBasis={isNonMobileScreens ? '26%' : undefined}>
          <UserWidget userId={userId} imgUrl={userImage} />{' '}
          {/* Pass userId directly */}
          <Box m='2rem 0' />
          <FriendListWidget userId={userId} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? '42%' : undefined}
          mt={isNonMobileScreens ? undefined : '2rem'}
        >
          <MyPostWidget imgUrl={userImage} />
          <Box m='2rem 0' />
          <PostsWidget userId={userId} isProfile />
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
