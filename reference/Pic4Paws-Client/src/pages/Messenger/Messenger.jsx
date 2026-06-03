import Message from '../../components/Message/Message';
import Conversations from '../../components/Conversations/Conversations';
import Navbar from '../navBar/index';
import './Styles.css';
import { Box, Button, InputBase, Typography } from '@mui/material';
import ChatOnline from '../../components/ChatOnline/ChatOnline';
import { useState, useEffect, useRef } from 'react';
import { userConversations } from '../../api/conversations.api';
import { sendMessage, userMessages } from '../../api/messages.api';
import { io } from 'socket.io-client';
import { getId } from '../../api/users.api';
import ChatImg from '../../assets/images/PawchaChat.webp';
import { useContext } from 'react';
import { AuthContext } from '../../context/auth.context.jsx';
import { GUEST_USER_ID } from '../../data/guestDemo.js';

const Messenger = () => {
  const { isGuest } = useContext(AuthContext);
  const userId = isGuest ? GUEST_USER_ID : localStorage.getItem('userId');
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const socket = useRef(null);
  const scrollRef = useRef();

  //ws://localhost:8900 env. instead of the render

  useEffect(() => {
    if (isGuest) return;

    const User = async () => {
      const response = await getId(userId);
      const currentUser = response.data;
      setUserInfo(currentUser);
    };
    if (userId) {
      User();
    }
  }, [isGuest, userId]);

  useEffect(() => {
    if (isGuest) return undefined;

    const token = localStorage.getItem('authToken');

    socket.current = io(`${import.meta.env.VITE_CHAT_URL}`, {
      auth: { token }
    });

    socket.current.on('getMessage', data => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now()
      });
    });

    return () => {
      socket.current?.off('getMessage');
      socket.current?.off('getUsers');
      socket.current?.disconnect();
      socket.current = null;
    };
  }, [isGuest]);

  useEffect(() => {
    arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.sender) &&
      setMessages(prev => [...prev, arrivalMessage]);
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    if (userInfo && socket.current) {
      const handleGetUsers = users => {
        setOnlineUsers(
          userInfo.friends.filter(f => users.some(u => u.userId === f))
        );
      };

      socket.current.on('getUsers', handleGetUsers);

      return () => {
        socket.current?.off('getUsers', handleGetUsers);
      };
    }
  }, [userId, userInfo]);

  useEffect(() => {
    if (isGuest) return;

    const getConversations = async () => {
      try {
        const res = await userConversations(userId);

        if (res) {
          setConversations(res.data);
        }
      } catch (error) {
        console.log('An error occurred while getting conversations:', error);
      }
    };
    getConversations();
  }, [isGuest, userId]);

  useEffect(() => {
    if (isGuest) return;

    const getMessages = async () => {
      if (!currentChat?._id) {
        setMessages([]);
        return;
      }

      try {
        const res = await userMessages(currentChat._id);
        setMessages(res.data);
      } catch (error) {
        console.log('MESSENGER: error fetching messages:', error);
      }
    };
    getMessages();
  }, [currentChat, isGuest]);

  const handleSubmit = async e => {
    e.preventDefault();

    if (!newMessage.trim() || !currentChat) {
      return;
    }

    const message = {
      sender: userId,
      text: newMessage.trim(),
      conversationId: currentChat._id
    };

    const receiverId = currentChat.members.find(member => member !== userId);

    socket.current.emit('sendMessage', {
      senderId: userId,
      receiverId,
      conversationId: currentChat._id,
      text: message.text
    });

    try {
      const res = await sendMessage(message);
      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (error) {
      console.log('MESSENGER:error occurred sending a new message:', error);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  if (isGuest) {
    return (
      <>
        <Navbar />
        <Box className='messenger'>
          <Box className='chatBox' sx={{ flex: 1 }}>
            <Box className='chatBoxWrapper'>
              <img src={ChatImg} alt='PawChat demo' />
              <Typography
                fontSize={30}
                color='#455eb5'
                className='noConversationText'
                fontWeight={200}
              >
                PawChat is available after creating an account.
              </Typography>
              <Typography color='#6bbb52' textAlign='center'>
                Guest mode keeps your demo posts, likes and comments only in
                this browser session.
              </Typography>
            </Box>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box className='messenger'>
        <Box className='chatMenu'>
          <Box className='chatMenuWrapper'>
            <InputBase
              placeholder='Search for friends'
              className='chatMenuInput'
            />
            {conversations &&
              conversations.map(c => (
                <Box key={c._id} onClick={() => setCurrentChat(c)}>
                  <Conversations conversation={c} currentUser={userId} />
                </Box>
              ))}
          </Box>
        </Box>
        <Box className='chatBox'>
          <Box className='chatBoxWrapper'>
            {currentChat ? (
              <>
                <Box className='chatBoxTop'>
                  {messages &&
                    messages.map((m, index) => (
                      <Box key={`${m._id}-${index}`}>
                        <Box ref={scrollRef} />
                        <Message
                          key={m._id}
                          own={m.sender === userId}
                          message={m}
                        />
                      </Box>
                    ))}
                </Box>
                <Box className='chatBoxBottom'>
                  <InputBase
                    className='chatMessageInput'
                    placeholder='Write Some Paws'
                    onChange={e => setNewMessage(e.target.value)}
                    value={newMessage}
                  ></InputBase>
                  <Button className='chatSubmitButton' onClick={handleSubmit}>
                    Send
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <img src={ChatImg} />
                <Typography
                  fontSize={30}
                  color='#455eb5'
                  className='noConversationText'
                  fontWeight={200}
                >
                  <h1>
                    Welcome to{' '}
                    <span
                      style={{
                        color: '#6bbb52',
                        fontWeight: 'bold'
                      }}
                    >
                      PawChat
                    </span>
                    !{' '}
                  </h1>

                  <p>Select a Pawsome Friend </p>
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <Box className='chatOnline'>
          <Typography variant='h2' textAlign='center'>
            Online
          </Typography>
          <ChatOnline
            onlineUsers={onlineUsers}
            currentId={userId}
            setCurrentChat={setCurrentChat}
          />
        </Box>
      </Box>
    </>
  );
};

export default Messenger;
