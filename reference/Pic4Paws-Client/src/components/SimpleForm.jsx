import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme();

export default function SimpleForm() {
  const handleSubmit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get('email'),
      password: data.get('password')
    });
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component='main' maxWidth='xs'>
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Box
            component='form'
            noValidate
            onSubmit={handleSubmit}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id='address'
                  label='Address'
                  name='address'
                  autoComplete='address'
                  style={{
                    backgroundColor: 'White',
                    borderRadius: '30px'
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete='zip-code'
                  name='zipCode'
                  required
                  fullWidth
                  id='zipCode'
                  label='Zip-Code'
                  style={{
                    backgroundColor: 'White',
                    borderRadius: '30px'
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id='phoneNumber'
                  label='Phone Number'
                  name='phoneNumber'
                  autoComplete='phone-number'
                  style={{
                    backgroundColor: 'White',
                    borderRadius: '30px'
                  }}
                />
              </Grid>
            </Grid>
            {/* <Button
              type='submit'
              fullWidth
              variant='contained'
              sx={{ mt: 3, mb: 2 }}
            >
              Ta
            </Button> */}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
