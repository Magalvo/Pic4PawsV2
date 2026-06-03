import EditOutlinedModule from '@mui/icons-material/EditOutlined';
import DeleteOutlinedModule from '@mui/icons-material/DeleteOutlined';
import AttachFileOutlinedModule from '@mui/icons-material/AttachFileOutlined';
import ImageOutlinedModule from '@mui/icons-material/ImageOutlined';
import MoreHorizOutlinedModule from '@mui/icons-material/MoreHorizOutlined';

import {
  Box,
  Divider,
  Typography,
  InputBase,
  useTheme,
  Button,
  IconButton,
  useMediaQuery
} from '@mui/material';

import Dropzone from 'react-dropzone';
import FlexBetween from '../../components/flexBetween';
import UserImage from '../../components/userImage';
import WidgetWrapper from '../../components/WidgetWrapper';
import { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPosts } from '../../state/index.js';
import { upload, addPost } from '../../api/posts.api';
import { resolveComponent } from '../../utils/componentInterop.js';
import { AuthContext } from '../../context/auth.context.jsx';
import { GUEST_USER_ID, guestUser } from '../../data/guestDemo.js';

const EditOutlined = resolveComponent(EditOutlinedModule);
const DeleteOutlined = resolveComponent(DeleteOutlinedModule);
const AttachFileOutlined = resolveComponent(AttachFileOutlinedModule);
const ImageOutlined = resolveComponent(ImageOutlinedModule);
const MoreHorizOutlined = resolveComponent(MoreHorizOutlinedModule);

 
const MyPostWidget = () => {
  const dispatch = useDispatch();
  const { isGuest } = useContext(AuthContext);
  const currentPosts = useSelector(state => state.posts);
  const [isImage, setIsImage] = useState(false);
  const [image, setImage] = useState(null);
  const [isAttachment, setIsAttachment] = useState(false);
  const [attachment, setAttachment] = useState(null);

  const [post, setPost] = useState('');
  const { palette } = useTheme();
  const userId = isGuest ? GUEST_USER_ID : localStorage.getItem('userId');
  const isNonMobileScreens = useMediaQuery('(min-width: 1000px)');
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;
  const [postLength, setPostLength] = useState(0);

  const handlePost = async () => {
    if (isGuest) {
      const newPost = {
        _id: `guest-post-${Date.now()}`,
        userId: GUEST_USER_ID,
        firstName: guestUser.firstName,
        lastName: guestUser.lastName,
        description: post,
        location: guestUser.location,
        imgUrl: image ? URL.createObjectURL(image) : '',
        userPicturePath: guestUser.imgUrl,
        likes: {},
        comments: []
      };

      dispatch(setPosts({ posts: [newPost, ...currentPosts] }));
      setImage(null);
      setAttachment(null);
      setPost('');
      setPostLength(0);
      return;
    }

    const newPost = { description: post };

    if (image) {
      const uploadData = new FormData();
      uploadData.append('file', image);
      const response = await upload(uploadData);
      newPost.imgUrl = response.data.fileUrl;
    }

    const response = await addPost(newPost);
    const posts = response.data;
    dispatch(setPosts({ posts }));
    setImage(null);
    setAttachment(null);
    setPost('');
    setPostLength(0);
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap='1.5rem'>
        <UserImage userId={userId} size='60px' />
        <InputBase
          placeholder="What's on your mind..."
          onChange={e => {
            setPost(e.target.value);
            setPostLength(e.target.value.length);
          }}
          value={post}
          sx={{
            width: '100%',
            backgroundColor: palette.neutral.light,
            borderRadius: '2rem',
            padding: '1rem 2rem',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: palette.neutral.light,
              boxShadow: `0 2px 8px ${palette.primary.main}20`
            },
            '&.Mui-focused': {
              backgroundColor: palette.neutral.light,
              boxShadow: `0 2px 12px ${palette.primary.main}30`
            }
          }}
        />
      </FlexBetween>
      
      {postLength > 0 && (
        <Typography
          variant='caption'
          sx={{
            color: postLength > 280 ? palette.error.main : palette.neutral.medium,
            mt: '0.5rem',
            display: 'block',
            textAlign: 'right'
          }}
        >
          {postLength}/280
        </Typography>
      )}
      {isImage && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius='5px'
          mt='1rem'
          p='1rem'
        >
          <Dropzone
            acceptedFiles='.jpg,.jpeg,.png'
            multiple={false}
            onDrop={acceptedFiles => setImage(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p='1rem'
                  width='100%'
                  sx={{ '&:hover': { cursor: 'pointer' } }}
                >
                  <input {...getInputProps()} />
                  {!image ? (
                    <Typography>Add Image Here</Typography>
                  ) : (
                    <FlexBetween>
                      <Typography>{image.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {image && (
                  <IconButton
                    onClick={() => setImage(null)}
                    sx={{ width: '15%' }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      {isAttachment && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius='5px'
          mt='1rem'
          p='1rem'
        >
          <Dropzone
            acceptedFiles='.jpg,.jpeg,.png'
            multiple={false}
            onDrop={acceptedFiles => setAttachment(acceptedFiles[0])}
          >
            {({ getRootProps, getInputProps }) => (
              <FlexBetween>
                <Box
                  {...getRootProps()}
                  border={`2px dashed ${palette.primary.main}`}
                  p='1rem'
                  width='100%'
                  sx={{ '&:hover': { cursor: 'pointer' } }}
                >
                  <input {...getInputProps()} />
                  {!attachment ? (
                    <Typography>Add Attachment Here</Typography>
                  ) : (
                    <FlexBetween>
                      <Typography>{attachment.name}</Typography>
                      <EditOutlined />
                    </FlexBetween>
                  )}
                </Box>
                {attachment && (
                  <IconButton
                    onClick={() => setAttachment(null)}
                    sx={{ width: '15%' }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </FlexBetween>
            )}
          </Dropzone>
        </Box>
      )}

      <Divider sx={{ margin: '1.25rem 0' }} />

      <FlexBetween>
        <FlexBetween gap='0.25rem' onClick={() => setIsImage(!isImage)}>
          <ImageOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ '&:hover': { cursor: 'pointer', color: medium } }}
          >
            Image
          </Typography>
        </FlexBetween>

        {/*  <Divider sx={{ margin: '1.25rem 0' }} /> */}

        <FlexBetween
          gap='0.25rem'
          onClick={() => setIsAttachment(!isAttachment)}
        >
          <AttachFileOutlined sx={{ color: mediumMain }} />
          <Typography
            color={mediumMain}
            sx={{ '&:hover': { cursor: 'pointer', color: medium } }}
          >
            Attachment
          </Typography>
        </FlexBetween>

        {/* /<Divider sx={{ margin: '1.25rem 0' }} /> */}

        {isNonMobileScreens ? (
          <>
            {/* <FlexBetween gap='0.25rem'>
              <GifBoxOutlined sx={{ color: mediumMain }} />
              <Typography color={mediumMain}>Clip</Typography>
            </FlexBetween> */}

            {/*    <FlexBetween gap='0.25rem'>
              <AttachFileOutlined sx={{ color: mediumMain }} />
              <Typography color={mediumMain}>Attachment</Typography>
            </FlexBetween> */}

            {/*  <FlexBetween gap='0.25rem'>
              <MicOutlined sx={{ color: mediumMain }} />
              <Typography color={mediumMain}>Audio</Typography>
            </FlexBetween> */}
          </>
        ) : (
          <FlexBetween gap='0.25rem'>
            <MoreHorizOutlined sx={{ color: mediumMain }} />
          </FlexBetween>
        )}

        <Button
          disabled={!post}
          onClick={handlePost}
          sx={{
            color: palette.background.alt,
            backgroundColor: palette.primary.main,
            borderRadius: '3rem'
          }}
        >
          POST
        </Button>
      </FlexBetween>
    </WidgetWrapper>
  );
};

export default MyPostWidget;
