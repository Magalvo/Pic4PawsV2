import { Box } from '@mui/material';
import { getId } from '../api/users.api';
import { useCallback, useEffect, useState } from 'react';
import { guestFriends, guestUser } from '../data/guestDemo.js';

 
const UserImage = ({ userId, size = '40px', userPicturePath }) => {
  const [imgUrl, setImgUrl] = useState('');

  const fetchImage = useCallback(async () => {
    if (userPicturePath) {
      setImgUrl(userPicturePath);
      return;
    }

    if (sessionStorage.getItem('guestMode') === 'true') {
      const demoUser = [guestUser, ...guestFriends].find(
        user => user._id === userId
      );
      setImgUrl(demoUser?.imgUrl || guestUser.imgUrl);
      return;
    }

    try {
      const response = await getId(userId);
      const Img = response.data.imgUrl;
      setImgUrl(Img);
    } catch (error) {
      console.log('Error fetching uer image', error);
    }
  }, [userId, userPicturePath]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  return (
    <Box width={size} height={size}>
      {imgUrl && (
        <img
          style={{ objectFit: 'cover', borderRadius: '50%' }}
          width={size}
          height={size}
          alt='user'
          src={imgUrl}
        />
      )}
    </Box>
  );
};

export default UserImage;
