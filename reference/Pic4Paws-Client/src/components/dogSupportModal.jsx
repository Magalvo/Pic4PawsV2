import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3
};

function ChildModal({ pet }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        rounded={'full'}
        width={'48%'} // Adjust the width to control button size and spacing
        mt={8}
        fontWeight='semibold'
        size={'lg'}
        py={'7'}
        bg='#6ecc51'
        onClick={handleOpen}
      >
        Adopt
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='child-modal-title'
        aria-describedby='child-modal-description'
      >
        <Box sx={{ ...style, width: 200 }}>
          <h2 id='child-modal-title'>Great {pet?.name} just found a home </h2>
          <p id='child-modal-description'>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </p>
          <Button onClick={handleClose}>Close</Button>
        </Box>
      </Modal>
    </>
  );
}

export default function DogSupportModal({ pet }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={handleOpen}>Confirm</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='parent-modal-title'
        aria-describedby='parent-modal-description'
      >
        <Box sx={{ ...style, width: 400 }}>
          <h2 id='parent-modal-title'>Thank You</h2>
          <p id='parent-modal-description'>
            Consider donating so we can continue helping
          </p>
          <ChildModal pet={pet} />
        </Box>
      </Modal>
    </div>
  );
}
