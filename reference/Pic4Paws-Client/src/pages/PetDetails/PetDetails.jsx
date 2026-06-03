import { Box, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getPet, removePet } from '../../api/pets.api';
import patinha from '../../assets/images/Patinha.png';
import './Styles.css';

export const PetDetails = () => {
  const [pet, setPet] = useState(null);
  const [image, setImage] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchPet = async () => {
    try {
      const response = await getPet(id);
      setPet(response.data);
      setImage(response.data.profilePicture);
      setDescription(response.data.petDescription);
      setAge(response.data.age);
    } catch (e) {
      console.log('Error Fetching Project', e);
    }
  };

  useEffect(() => {
    fetchPet();
  }, [id]);

  const handleDelete = async () => {
    try {
      await removePet(id);
      navigate('/projects');
    } catch (error) {
      console.log('error deleting your project', error);
    }
  };

  return (
    <Box className={classes.adoptionId}>
      <Box className={classes.div}>
        <Box className={classes.overlapGroup}>
          <img
            className={classes.adoravelCachorro}
            alt='Adoravel cachorro'
            src={image}
          />
          <Box className={classes.ellipse} />
          <Box className={classes.ellipse2} />
          <Box className={classes.element}>
            <Typography className={classes.textWrapper} variant='h1'>
              {age}
            </Typography>
          </Box>
          <Typography className={classes.h1} variant='h1'>
            Todd
          </Typography>
          <img className={classes.male} alt='Male' src='male-1.png' />
          <Box className={classes.rectangle} />
          <Box className={classes.rectangle2} />
          <Typography className={classes.textWrapper2} variant='subtitle1'>
            Support
          </Typography>
          <img
            className={classes.patinhacoraoBranca}
            alt='Patinhacorao branca'
            src={patinha}
          />
          <Typography className={classes.textWrapper3} variant='subtitle1'>
            Adopt Me
          </Typography>
          <img className={classes.heart} alt='Heart' src='heart-1.png' />
        </Box>
        <Typography className={classes.helloIMToddAnd} variant='body1'>
          <Typography
            className={classes.textWrapper4}
            variant='body1'
            fontWeight='bold'
          >
            {description}
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
};
