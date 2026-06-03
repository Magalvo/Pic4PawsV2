import './Styles.css';
import { Box, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { getUserFriends } from '../../api/users.api';
import {
  createConversation,
  onlineConversations
} from '../../api/conversations.api';

const ChatOnline = ({ onlineUsers, currentId, setCurrentChat }) => {
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);

  useEffect(() => {
    const getFriends = async () => {
      const res = await getUserFriends(currentId);
      setFriends(res.data);
    };
    getFriends();
  }, [currentId]);

  useEffect(() => {
    setOnlineFriends(friends.filter(f => onlineUsers.includes(f._id)));
  }, [onlineUsers, friends]);

  const handleClick = async user => {
    try {
      const res = await onlineConversations(currentId, user._id);
      if (res.data) {
        setCurrentChat(res.data);
        return;
      }

      const createdConversation = await createConversation(user._id);
      setCurrentChat(createdConversation.data);
    } catch (error) {
      console.log('CHATONLINE:', error);
    }
  };

  return (
    <Box className='chatOnline'>
      {onlineFriends.map(o => (
        <Box
          key={o._id}
          className='chatOnlineFriend'
          onClick={() => {
            handleClick(o);
          }}
        >
          <Box className='chatOnlineImgContainer'>
            <img
              className='chatOnlineImg'
              src={
                o?.imgUrl
                  ? o.imgUrl
                  : 'https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png'
              }
              alt='Profile'
            />
            <Box className='chatOnlineBadge'></Box>
          </Box>
          <Typography className='chatOnlineName'>
            {o?.firstName}
            {o?.lastName}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ChatOnline;
