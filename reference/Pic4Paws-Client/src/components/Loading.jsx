import LottieModule from 'lottie-react';
import { Box } from '@mui/material';
import Load from '../lotties/load1.json';
import { resolveComponent } from '../utils/componentInterop.js';

const Lottie = resolveComponent(LottieModule);

const Loading = () => {
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

export default Loading;
