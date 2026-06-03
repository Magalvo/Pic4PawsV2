 
import { Box, Typography } from '@mui/material';
import './Styles.css';
import { useEffect, useState } from 'react';
import { getId } from '../../api/users.api';

const Conversations = ({ conversation, currentUser }) => {
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(null);
  const [userImage, setUserImage] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const friendId = conversation.members.find(m => m !== currentUser);

    const getUser = async () => {
      try {
        const res = await getId(friendId);
        setUser(res.data);
        setUserImage(res.data.imgUrl);
        setName(res.data.firstName);
      } catch (error) {
        console.log('error on conversations component:', error);
      }
    };
    getUser();
  }, [currentUser, conversation]);
  return (
    <Box className='conversation'>
      <img className='conversationImg' src={userImage} alt='ProfilePic' />
      {/* <UserImage className='conversationImg' userId={userId} /> */}
      <Typography className='conversationName'>{name}</Typography>
    </Box>
  );
};

export default Conversations;
