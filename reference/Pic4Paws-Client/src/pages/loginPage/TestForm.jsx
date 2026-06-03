import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../../api/auth.api';
import { AuthContext } from '../../context/auth.context';

const TestForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState(undefined);

  const { handleGoogleAuthentication } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleEmail = e => {
    setEmail(e.target.value);
  };

  const handlePassword = e => {
    setPassword(e.target.value);
  };

  const handleName = e => {
    setName(e.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    try {
      const user = { email, password, firstName };
      await signup(user);
      navigate('/login');
    } catch (error) {
      console.log('Error signup up', error);
      const errorDescription = error.response.data.message;
      setErrorMessage(errorDescription);
    }
  };

  return (
    <div className='SignupPage'>
      <h1>Sign Up</h1>

      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input type='email' name='email' value={email} onChange={handleEmail} />

        <label>Password:</label>
        <input
          type='password'
          name='password'
          value={password}
          onChange={handlePassword}
        />

        <label>Name:</label>
        <input
          type='text'
          name='name'
          value={firstName}
          onChange={handleName}
        />

        <button type='submit'>Sign Up</button>
      </form>

      {errorMessage && <p className='error-message'>{errorMessage}</p>}
      <button onClick={handleGoogleAuthentication}>Signup With Google</button>

      <p>Already have account?</p>
      <Link to={'/login'}> Login</Link>
    </div>
  );
};

export default TestForm;
