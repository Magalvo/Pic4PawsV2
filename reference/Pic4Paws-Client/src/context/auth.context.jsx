import { createContext, useCallback, useEffect, useState } from 'react';
import {
  auth,
  getAdditionalInfo,
  signInWithGoogle
} from '../config/firebase.config';
import { signupGoogle } from '../api/auth.api.js';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setPosts } from '../state/index.js';
import { GUEST_USER_ID, guestPosts, guestUser } from '../data/guestDemo.js';

const AuthContext = createContext();

export const AuthProviderWrapper = props => {
  const isLoggedIn = useSelector(state => state.isLoggedIn);
  const isGuest = useSelector(state => state.isGuest);
  const isLoading = useSelector(state => state.isLoading);
  const user = useSelector(state => state.user);
  const authToken = useSelector(state => state.authToken);
  const [stateIsLoggedIn, stateSetIsLoggedIn] = useState(false);
  const [stateIsLoading, stateSetIsLoading] = useState(true);
  const [stateUser, stateSetUser] = useState(null);

  const dispatch = useDispatch();

  const verifyUser = useCallback(() => {
    return auth.onAuthStateChanged(async firebaseUser => {
      if (!firebaseUser) {
        if (sessionStorage.getItem('guestMode') === 'true') {
          dispatch(
            setUser({
              isLoggedIn: false,
              isGuest: true,
              isLoading: false,
              user: guestUser,
              authToken: null
            })
          );
          dispatch(setPosts({ posts: guestPosts }));
          stateSetUser(guestUser);
          stateSetIsLoggedIn(true);
          stateSetIsLoading(false);
          return;
        }

        dispatch(
          setUser({
            isLoggedIn: false,
            isGuest: false,
            isLoading: false,
            user: null,
            authToken: null
          })
        );
        stateSetUser(null);
        stateSetIsLoggedIn(false);
      } else if (
        firebaseUser.providerData.length &&
        firebaseUser.providerData[0].providerId === 'google.com'
      ) {
        const loggedInUser = {
          firstName: firebaseUser.displayName,
          email: firebaseUser.email
        };
        stateSetUser(loggedInUser);
        stateSetIsLoggedIn(true);

        const authToken = await firebaseUser.getIdToken();
        localStorage.setItem('authToken', authToken);

        dispatch(
          setUser({
            isLoggedIn: true,
            isGuest: false,
            isLoading: false,
            user: loggedInUser, // Update the user value
            authToken: authToken
          })
        );
      } else {
        const { claims } = await firebaseUser.getIdTokenResult();
        const loggedInUser = {
          firstName: claims.firstName,
          email: claims.email
        };
        stateSetUser(loggedInUser);

        const loggedInUserJson = JSON.stringify(loggedInUser);
        localStorage.setItem('User', loggedInUserJson);

        const authToken = await firebaseUser.getIdToken();
        localStorage.setItem('authToken', authToken);

        dispatch(
          setUser({
            isLoggedIn: true,
            isGuest: false,
            isLoading: false,
            user: loggedInUser, // Update the user value
            authToken: authToken
          })
        );
      }
      stateSetIsLoading(false);
    });
  }, [dispatch]);

  const handleGoogleAuthentication = async () => {
    try {
      const userCredential = await signInWithGoogle();
      const additionalInfo = getAdditionalInfo(userCredential);
      const authToken = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', authToken);

      const userData = {
        firstName: userCredential.user.displayName,
        email: userCredential.user.email,
        imgUrl: userCredential.user.photoURL
      };

      const response = await signupGoogle(userData);

      if (response.data?._id) {
        const userId = response.data._id;
        localStorage.setItem('userId', userId);
      }

      if (additionalInfo.isNewUser) {
        return response;
      }
    } catch (error) {
      console.log('Error authenticating with Google', error);
    }
  };

  const removeToken = () => {
    dispatch(
      setUser({
        isLoggedIn: false,
        isGuest: false,
        isLoading: false,
        authToken: null,
        user: null
      })
    );
    dispatch(setPosts({ posts: [] }));
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('User');
    sessionStorage.removeItem('guestMode');
    sessionStorage.removeItem('guestUserId');
    sessionStorage.removeItem('guestAdoptionPets');
    auth.signOut();
  };

  const logOutUser = () => {
    removeToken();
  };

  const startGuestSession = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('User');
    sessionStorage.setItem('guestMode', 'true');
    sessionStorage.setItem('guestUserId', GUEST_USER_ID);
    sessionStorage.removeItem('guestAdoptionPets');
    dispatch(
      setUser({
        isLoggedIn: false,
        isGuest: true,
        isLoading: false,
        user: guestUser,
        authToken: null
      })
    );
    dispatch(setPosts({ posts: guestPosts }));
    stateSetUser(guestUser);
    stateSetIsLoggedIn(true);
    stateSetIsLoading(false);
  };

  useEffect(() => {
    const unsubscribe = verifyUser();
    return unsubscribe;
  }, [verifyUser]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isGuest,
        isLoading,
        user,
        authToken,
        stateIsLoggedIn,
        stateIsLoading,
        stateUser,
        logOutUser,
        handleGoogleAuthentication,
        startGuestSession
      }}
    >
      { }
      {props.children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
