import { Typography, Paper, Box } from '@mui/material';
import UserWidget from '../pages/widgets/UserWidget';

const InfoPet = () => {

  
  const desktopStyle = {
    backgroundColor: '#b4c9ff',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%'
  };

  const containerStyle = {
    backgroundColor: '#b4c9ff',
    border: '1px none',
    height: 1024,
    position: 'relative',
    width: 1440
  };

  const overlapGroupStyle = {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: 610,
    left: 44,
    position: 'absolute',
    top: 134,
    width: 954,
    padding: '16px'
  };

  const rectangleStyle = {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: 408,
    left: 1035,
    position: 'absolute',
    top: 134,
    width: 374
  };

  const textStyle = {
    fontFamily: 'Inter-Regular, Helvetica',
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 'normal',
    whiteSpace: 'nowrap'
  };

  const titleStyle = {
    fontFamily: 'Inter-SemiBold, Helvetica',
    fontSize: 32,
    fontWeight: 600
  };

  const subtitleStyle = {
    fontFamily: 'Inter-Regular, Helvetica',
    fontSize: 24,
    fontWeight: 400
  };

  return (
    <Box style={desktopStyle}>
      <Box style={containerStyle}>
        <Paper elevation={0} style={overlapGroupStyle}>
          <Typography variant='h1' style={titleStyle}>
            Name
          </Typography>
          <Typography variant='h2' style={subtitleStyle}>
            About Pet
          </Typography>
          <Typography style={textStyle}>Description</Typography>
          <Typography style={textStyle}>subtitle</Typography>
          <Typography style={textStyle}>Age ° Race</Typography>
          <Typography style={textStyle}>Tags</Typography>
          <Typography style={textStyle}>Text</Typography>
          <Typography style={textStyle}>Text</Typography>
          <Typography style={textStyle}>Text</Typography>
        </Paper>
        <Box style={rectangleStyle}>
          <UserWidget />
        </Box>
      </Box>
    </Box>
  );
};

export default InfoPet;
