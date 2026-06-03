import LottieModule from 'lottie-react';
import { Box } from '@mui/material';
import Load from '../lotties/load2.json';
import { resolveComponent } from '../utils/componentInterop.js';

const Lottie = resolveComponent(LottieModule);

const Loading2 = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };
  return (
    <Box
      className='animation'
      display='flex'
      justifyContent='center'
      alignItems='center'
      height='100vh'
    >
      <Box
        style={{
          position: 'relative'
        }}
      >
        <Lottie
          options={defaultOptions}
          animationData={Load}
          height={100}
          width={100}
        />
      </Box>
    </Box>
  );
};

export default Loading2;
