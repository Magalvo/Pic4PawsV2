import { Skeleton, SkeletonCircle, SkeletonText } from '@chakra-ui/react';

import { Box } from '@chakra-ui/react';

function LoaderDiv() {
  return (
    <Box>
      <Skeleton>
        <Box padding='6' boxShadow='lg' bg='white'>
          <SkeletonCircle size='10' />
          <SkeletonText
            mt='4'
            noOfLines={4}
            spacing='4'
            skeletonHeight='2'
            w='20'
          />
        </Box>
      </Skeleton>
    </Box>
  );
}

export default LoaderDiv;
