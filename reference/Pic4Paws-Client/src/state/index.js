import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoggedIn: false,
  isGuest: false,
  isLoading: true,
  user: null,
  mode: 'light',
  authToken: null,
  posts: []
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setMode: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.isLoggedIn = action.payload.isLoggedIn;
      state.isGuest = Boolean(action.payload.isGuest);
      state.isLoading = action.payload.isLoading;
      state.authToken = action.payload.authToken;
    },
    setFriends: (state, action) => {
      if (state.user) {
        state.user.friends = action.payload.friends;
      } else {
        console.error('user friends non-existent :(');
      }
    },
    setPosts: (state, action) => {
      state.posts = action.payload.posts;
    },
    setPost: (state, action) => {
      const updatedPosts = state.posts.map(post => {
        if (post._id === action.payload.post._id) return action.payload.post;
        return post;
      });
      state.posts = updatedPosts;
    }
  }
});

export const { setUser, setMode, setFriends, setPosts, setPost } =
  authSlice.actions;

export default authSlice.reducer;
