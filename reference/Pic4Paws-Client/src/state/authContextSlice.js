import { createSlice } from '@reduxjs/toolkit';

const authContextSlice = createSlice({
  name: 'authContext',
  initialState: {
    isLoggedIn: false,
    isLoading: true,
    user: null
  },
  reducers: {
    setUser: (state, action) => {
      state.isLoggedIn = action.payload.isLoggedIn;
      state.isLoading = action.payload.isLoading;
      state.user = action.payload.user;
    }
  }
});

export const { setUser } = authContextSlice.actions;
export default authContextSlice.reducer;
