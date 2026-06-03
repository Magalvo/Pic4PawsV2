import { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getId, editUser } from '../api/users.api';
import { AuthContext } from '../context/auth.context.jsx';

const EditUser = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { isGuest } = useContext(AuthContext);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (isGuest) {
      navigate('/home', { replace: true });
      return;
    }

    if (userId && id !== userId) {
      navigate('/home', { replace: true });
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await getId(id);
        setFirstName(response.data.firstName);
        setLastName(response.data.lastName);
        setEmail(response.data.email);
        setLocation(response.data.location);
        setOccupation(response.data.occupation);
      } catch (error) {
        console.log('An error ocurred fetching the project', error);
      }
    };

    fetchUser();
  }, [id, isGuest, navigate, userId]);

  const handleFirstName = e => {
    setFirstName(e.target.value);
  };

  const handleLastName = e => {
    setLastName(e.target.value);
  };
  const handleEmail = e => {
    setEmail(e.target.value);
  };
  const handleLocation = e => {
    setLocation(e.target.value);
  };
  const handleOccupation = e => {
    setOccupation(e.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const updatedProject = {
        firstName,
        lastName,
        email,
        location,
        occupation,
        _id: id
      };
      await editUser(updatedProject);
      navigate('/home');
    } catch (e) {
      console.log('Error Updating the Project', e);
    }
  };

  return (
    <div className='EditProjectPage'>
      <h2>Edit User</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor=''>First Name:</label>
        <input
          type='text'
          name='title'
          value={firstName}
          onChange={handleFirstName}
        />
        <label htmlFor=''>Last Name:</label>
        <input
          type='text'
          name='title'
          value={lastName}
          onChange={handleLastName}
        />
        <label htmlFor=''>Email:</label>
        <input type='text' name='title' value={email} onChange={handleEmail} />
        <label htmlFor=''>Location:</label>
        <input
          type='text'
          name='title'
          value={location}
          onChange={handleLocation}
        />
        <label htmlFor=''>Occupation:</label>
        <input
          type='text'
          name='title'
          value={occupation}
          onChange={handleOccupation}
        />

        <button type='submit'>Update User</button>
      </form>
    </div>
  );
};

export default EditUser;
