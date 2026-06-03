import { useContext } from 'react';
import { AuthContext } from '../context/auth.context';
import { Navigate } from 'react-router-dom';
import Loading from './Loading';

const IsPrivate = props => {
  const { isLoggedIn, isGuest, isLoading } = useContext(AuthContext);

  //if the authentication i still ongoing
  if (isLoading) {
    return <Loading />;
  }

  if (!isLoggedIn && !isGuest) {
    return <Navigate to='/auth' />;
  } else {
    return props.children;
  }
};

export default IsPrivate;
