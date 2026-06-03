import { Typography, useTheme } from '@mui/material';
import FlexBetween from '../../components/flexBetween';
import WidgetWrapper from '../../components/WidgetWrapper';
import PawMin from '../../assets/images/PawMin.png';

const AdvertWidget = () => {
  const { palette } = useTheme();
  const dark = palette.neutral.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  return (
    <WidgetWrapper>
      <FlexBetween>
        <Typography color={dark} variant='h5' fontWeight='500'>
          Sponsored
        </Typography>
        <Typography color={medium}>Create Ad</Typography>
      </FlexBetween>
      <img
        width='100%'
        height='auto'
        alt='advert'
        src={PawMin}
        style={{ borderRadius: '0.75rem', margin: '0.75rem 0' }}
      />
      <FlexBetween>
        <Typography color={main}>PawShop</Typography>
        <Typography color={medium}>Help Us by Creating Memories</Typography>
      </FlexBetween>
      <Typography color={medium} m='0.5rem 0'>
        Shop for memories with your 4Paws, get a mug, a T-Shirt, a frame with
        the photo of your best friend and many more things! A small commission
        will help us help others :)
      </Typography>
    </WidgetWrapper>
  );
};

export default AdvertWidget;
