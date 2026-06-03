import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { Typography } from '@mui/material';
import LottieModule from 'lottie-react';
import Lot1 from '../lotties/dogBox.json';
import Hearth from '../assets/images/heart.png';
import SimpleForm from './SimpleForm';
import { useNavigate } from 'react-router-dom';
import { resolveComponent } from '../utils/componentInterop.js';

const Lottie = resolveComponent(LottieModule);

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#4d79ec',
  borderRadius: '30px',
  border: '1px solid #000',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3
};

const defaultOptions = {
  loop: true,
  autoplay: true,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

function ChildModal({ pet }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const navigate = useNavigate();

  return (
    <>
      <Button
        style={{
          borderRadius: '60px',
          width: '48%',
          marginTop: '0.5rem',
          fontWeight: 'bold',
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
          backgroundColor: '#6ecc51',
          color: 'white',
          boxShadow: '0px 4px 4px #00000040'
        }}
        boxShadow='24'
        onClick={handleOpen}
      >
        <Typography fontWeight={400}>
          <b>Take me Home!</b>
        </Typography>
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='child-modal-title'
        aria-describedby='child-modal-description'
      >
        <Box
          sx={{
            ...style,
            width: 700,
            height: 600,
            display: 'flex',
            flexDirection: 'column',
            alignContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography
            variant='h1'
            fontWeight={600}
            color='white'
            id='parent-modal-title'
          >
            <h1
              style={{ fontWeight: '6px', color: 'white', marginTop: '2rem' }}
            >
              Great! <span style={{ color: '#6bbb52' }}>{pet}</span> just found
              a Home!
            </h1>
          </Typography>
          <Box
            className='animation'
            height='350px'
            width='400px'
            style={{
              position: 'relative',
              left: '30%',
              transform: 'translateX(-50%)'
            }}
          >
            <Lottie
              options={defaultOptions}
              animationData={Lot1}
              height={200}
              width={200}
            />
          </Box>
          <Typography
            color='white'
            fontWeight={600}
            fontSize={20}
            id='child-modal-description'
          >
            Consider Donating to help other 4 Paws
          </Typography>
          <Button
            style={{
              borderRadius: '60px',
              width: '48%',
              marginTop: '0.5rem',
              fontWeight: 'bold',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              backgroundColor: '#6ecc51',
              color: 'white',
              boxShadow: '0px 4px 4px #00000040'
            }}
            boxShadow='24'
            onClick={handleClose}
          >
            <Typography fontWeight={400} onClick={() => navigate('/pets')}>
              <b>Go Back to Ark</b>
            </Typography>
          </Button>
        </Box>
      </Modal>
    </>
  );
}

export default function CatAdoptionModal({ pet }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box width='48%'>
      <Button
        fullWidth
        style={{
          borderRadius: '60px',
          width: '100%',
          marginTop: '0.5rem',
          fontWeight: 'bold',
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
          backgroundColor: '#6ecc51',
          color: 'white'
        }}
        onClick={handleOpen}
      >
        Adopt
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='parent-modal-title'
        aria-describedby='parent-modal-description'
      >
        <Box
          sx={{
            ...style,
            width: 700,
            height: 500,
            display: 'flex',
            flexDirection: 'column',
            alignContent: 'center',
            alignItems: 'center'
          }}
        >
          <Typography
            variant='h1'
            fontWeight={600}
            color='white'
            id='parent-modal-title'
          >
            It&apos;s a Match!
          </Typography>
          <img src={Hearth} style={{ height: '40px', width: 'auto' }} />
          <p id='parent-modal-description' style={{ color: 'white' }}>
            Just A Few More Steps Before you meet Your new Best Friend
          </p>
          <SimpleForm />
          <ChildModal pet={pet} />
        </Box>
      </Modal>
    </Box>
  );
}
