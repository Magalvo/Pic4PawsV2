import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography } from '@mui/material';
import { setPosts } from '../../state/index.js';
import PostWidget from '../widgets/PostWidget.jsx';
import { getAll, userPosts } from '../../api/posts.api.js';
import { AuthContext } from '../../context/auth.context.jsx';
import { guestPosts } from '../../data/guestDemo.js';

 
const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector(state => state.posts);
  const { isGuest } = useContext(AuthContext);

  const getPosts = async () => {
    const response = await getAll();
    const data = response.data;

    dispatch(setPosts({ posts: data }));
  };

  const getUserPosts = async () => {
    const response = await userPosts(userId);
    const data = response.data;
    dispatch(setPosts({ posts: data }));
  };

  useEffect(() => {
    if (isGuest) {
      dispatch(setPosts({ posts: guestPosts }));
      return;
    }

    if (isProfile) {
      getUserPosts();
    } else {
      getPosts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {!posts || posts.length === 0 ? (
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '3rem 1rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            mt: '2rem'
          }}
        >
          <Typography variant='h6' sx={{ color: '#999', fontWeight: 500, mb: '0.5rem' }}>
            No posts yet
          </Typography>
          <Typography variant='body2' sx={{ color: '#bbb' }}>
            {isGuest ? 'Be the first to share in guest mode!' : 'Start sharing your story!'}
          </Typography>
        </Box>
      ) : (
        posts.map(
          ({
            _id,
            userId,
            firstName,
            lastName,
            description,
            location,
            imgUrl,
            userPicturePath,
            likes,
            comments
          }) => (
            <Box key={_id} sx={{ mb: '1.5rem' }}>
              <PostWidget
                postId={_id}
                postUserId={userId}
                name={`${firstName} ${lastName}`}
                description={description}
                location={location}
                imgUrl={imgUrl}
                userPicturePath={userPicturePath}
                likes={likes}
                comments={comments}
              />
            </Box>
          )
        )
      )}
    </>
  );
};

export default PostsWidget;
