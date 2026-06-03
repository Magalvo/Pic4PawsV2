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
import { resolveComponent } from '../../../utils/componentInterop.js';

const FavoriteIcon = resolveComponent(FavoriteIconModule);
const ShareIcon = resolveComponent(ShareIconModule);
const MoreHorizIcon = resolveComponent(MoreHorizIconModule);

export default function PetWidget({ pet }) {
  const navigate = useNavigate();

  return (
    <Card className='card'>
      <CardMedia
        className='media'
        image={
          pet.profilePicture ||
          'https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png'
        }
        title={pet.petName}
      />
      <div className='overlay'>
        {' '}
        <Typography variant='h6'>{pet.petName}</Typography>
        <Typography variant='body2'>
          {moment(pet.createdAt).fromNow()}
        </Typography>
      </div>
      <div className='overlay2'>
        {' '}
        <Button
          style={{ color: 'white' }}
          size='small'
          onClick={() => navigate(`/pets/${pet._id}`)}
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
        {pet.petName}
      </Typography>
      <CardContent>
        <Typography variant='body2' color='textSecondary' component='p'>
          {pet.petDescription}
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
