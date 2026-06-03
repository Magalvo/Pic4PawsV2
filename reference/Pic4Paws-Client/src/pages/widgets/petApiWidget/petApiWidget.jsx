 
import { useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FavoriteIconModule from '@mui/icons-material/Favorite';
import ShareIconModule from '@mui/icons-material/Share';
import { Button } from '@mui/material';
import MoreHorizIconModule from '@mui/icons-material/MoreHoriz';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import './Styles.css'; // Import the CSS file
import axios from 'axios';
import { resolveComponent } from '../../../utils/componentInterop.js';

const FavoriteIcon = resolveComponent(FavoriteIconModule);
const ShareIcon = resolveComponent(ShareIconModule);
const MoreHorizIcon = resolveComponent(MoreHorizIconModule);

export default function PetApiWidget({ pet }) {
  const navigate = useNavigate();
  const [dogPhoto, setDogPhoto] = useState(null);
  const [catPhoto, setCatPhoto] = useState(null);

  useEffect(() => {
    if (pet.type === 'Dog') {
      fetchRandDog();
    } else if (pet.type === 'Cat') {
      fetchRandCat();
    }
  }, [pet]);

  const fetchRandDog = async () => {
    try {
      const response = await axios.get(
        'https://dog.ceo/api/breeds/image/random'
      );
      const photoUrl = response.data.message;
      setDogPhoto(photoUrl);
    } catch {
      // Handle error if needed
    }
  };

  const fetchRandCat = async () => {
    try {
      const response = await axios.get(
        'https://api.thecatapi.com/v1/images/search'
        ,
        {
          headers: {
            'x-api-key': import.meta.env.VITE_CAT_API
          }
        }
      );
      const photoUrl = response.data[0].url;
      setCatPhoto(photoUrl);
    } catch (error) {
      console.log('FETCHING_RAND_CAT', error);
    }
  };

  return (
    <Card className='card'>
      <CardMedia
        className='media'
        image={
          pet.primary_photo_cropped?.medium ||
          (pet.type === 'Dog'
            ? dogPhoto
            : pet.type === 'Cat'
            ? catPhoto
            : 'https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png')
        }
        title={pet.name}
      />
      <div className='overlay'>
        {' '}
        <Typography variant='h6'>{pet.name}</Typography>
        <Typography variant='body2'>
          {moment(pet.published_at).fromNow()}
        </Typography>
      </div>
      <div className='overlay2'>
        {' '}
        <Button
          style={{ color: 'white' }}
          size='small'
          onClick={() =>
            navigate(
              pet.isGuestDemo ? `/pets/guest/${pet.id}` : `/animals/${pet.id}`,
              {
                state: pet.isGuestDemo ? { pet } : undefined
              }
            )
          }
        >
          <MoreHorizIcon fontSize='medium' />
        </Button>
      </div>
      <div className='details'>
        <Typography variant='body2' color='textSecondary' component='h2'>
          {pet.tags.map(tag => `#${tag} `)}
        </Typography>
      </div>
      <Typography className='title' gutterBottom variant='h5' component='h2'>
        {pet.name}
      </Typography>
      <CardContent>
        <Typography variant='body2' color='textSecondary' component='p'>
          {pet.description}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton aria-label='add to favorites'>
          <FavoriteIcon />
        </IconButton>
        <IconButton aria-label='share'>
          <ShareIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
