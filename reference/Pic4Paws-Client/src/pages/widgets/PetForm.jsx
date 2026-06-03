import { useState, useEffect } from 'react';
import axios from 'axios';

import { Formik } from 'formik';
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  FormControl
} from '@mui/material';
import Dropzone from 'react-dropzone';
import EditOutlinedIconModule from '@mui/icons-material/EditOutlined';
import FlexBetween from '../../components/flexBetween';

import { createPet, upload } from '../../api/pets.api';
import MapComponent from '../../components/GoogleMaps';
import { resolveComponent } from '../../utils/componentInterop.js';

const EditOutlinedIcon = resolveComponent(EditOutlinedIconModule);

const PetForm = ({ refreshList }) => {
  //const [photos, setPhotos] = useState([]);
  const [breedSelectionVisible, setBreedSelectionVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [catBreeds, setCatBreeds] = useState([]);
  const [dogBreeds, setDogBreeds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const { palette } = useTheme();

  const userId = localStorage.getItem('userId');

  const initialValues = {
    petDescription: '',
    pictures: [],
    petName: '',
    petType: '',
    primaryBreed: '',
    secondaryBreed: '',
    tags: [],
    gender: '',
    age: ''
  };

  const getCatBreeds = async () => {
    const res = await axios('https://api.thecatapi.com/v1/breeds', {
      headers: {
        'x-api-key': import.meta.env.VITE_CAT_API
      }
    });
    setCatBreeds(res.data);
  };

  useEffect(() => {
    getCatBreeds().catch(error => {
      // ...handle the error...
      console.error('error fetching breeds', error);
    });
  }, []);

  const getDogBreeds = async () => {
    const res = await axios('https://api.thedogapi.com/v1/breeds', {
      headers: {
        'x-api-key': import.meta.env.VITE_DOG_API
      }
    });
    setDogBreeds(res.data);
  };

  useEffect(() => {
    getDogBreeds().catch(error => {
      // ...handle the error...
      console.error('error fetching breeds', error);
    });
  }, []);

  const handleSubmit = async (values, onSubmitProps) => {
    try {
      const newPet = {
        petDescription: values.petDescription,
        pictures: values.pictures,
        petName: values.petName,
        petType: values.petType,
        primaryBreed: values.primaryBreed,
        secondaryBreed: values.secondaryBreed,
        tags: values.tags,
        gender: values.gender,
        age: values.age
      };

      if (selectedLocation) {
        newPet.location = {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        };
      }

      if (newPet.pictures.length > 0) {
        // Upload each image to Cloudinary
        const uploadedUrls = await Promise.all(
          newPet.pictures.map(async image => {
            const uploadData = new FormData();
            uploadData.append('file', image);
            const response = await upload(uploadData);
            return response.data.fileUrl;
          })
        );
        newPet.photos = uploadedUrls;
      }

      newPet.userId = userId;

      await createPet(newPet);
      onSubmitProps.resetForm();

      refreshList();
    } catch (error) {
      console.log('Error Updating the Project', error);
    }
  };

  const handleLocationSelect = selectedLocation => {
    setSelectedLocation(selectedLocation);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        error => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  return (
    <>
      <Formik onSubmit={handleSubmit} initialValues={initialValues}>
        {({
          values,
          handleBlur,
          handleChange,
          handleSubmit,
          setFieldValue
        }) => {
          const handleTypeChange = event => {
            const selectedType = event.target.value;
            setFieldValue('petType', selectedType);

            // Check if the "Type" field has been selected and update the breedSelectionVisible state
            if (
              selectedType &&
              (selectedType === 'Cat' || selectedType === 'Dog')
            ) {
              setBreedSelectionVisible(true);
            } else {
              setBreedSelectionVisible(false);
            }
          };

          return (
            <Box>
              <Typography
                variant='h5'
                color='#638bf1'
                textAlign='center'
                fontWeight='bold'
                fontSize='2rem'
                mb='1rem'
              >
                Create a New 4 Paws
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      placeholder='Pet Name'
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.petName}
                      name='petName'
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel id='gender-label'>Gender</InputLabel>
                      <Select
                        labelId='gender-label'
                        id='gender-id'
                        onBlur={handleBlur}
                        value={values.gender}
                        onChange={handleChange}
                        label='Gender'
                        name='gender'
                      >
                        <MenuItem value='Male'>Male</MenuItem>
                        <MenuItem value='Female'>Female</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel id='type'>Type</InputLabel>
                      <Select
                        fullWidth
                        labelId='type'
                        id='demo-simple-select'
                        onBlur={handleBlur}
                        value={values.petType}
                        label='Cat | Dog'
                        onChange={handleTypeChange}
                      >
                        <MenuItem value='Cat'>Cat</MenuItem>
                        <MenuItem value='Dog'>Dog</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel id='age'>Age</InputLabel>
                      <Select
                        fullWidth
                        placeholder='Age'
                        labelId='age'
                        id='demo-simple-select'
                        onBlur={handleBlur}
                        value={values.age}
                        label='Age'
                        name='age'
                        onChange={handleChange}
                      >
                        <MenuItem value='Baby'>Baby (0-1y)</MenuItem>
                        <MenuItem value='Young'>Young (1-2y)</MenuItem>
                        <MenuItem value='Adult'>Adult (3-8y)</MenuItem>
                        <MenuItem value='Senior'>Senior (8y+)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Primary Breed */}
                  <Grid item xs={12} sm={6}>
                    {breedSelectionVisible && (
                      <>
                        {values.petType === 'Cat' ? (
                          <>
                            <Autocomplete
                              id='catBreed'
                              options={catBreeds}
                              getOptionLabel={option => option.name}
                              fullWidth
                              value={values.primaryBreed}
                              onChange={(event, newValue) =>
                                setFieldValue('primaryBreed', newValue)
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label='Primary Cat Breed'
                                  variant='outlined'
                                />
                              )}
                            />
                          </>
                        ) : (
                          <>
                            <Autocomplete
                              id='dogBreed'
                              options={dogBreeds}
                              getOptionLabel={option => option.name}
                              fullWidth
                              value={values.primaryBreed}
                              onChange={(event, newValue) =>
                                setFieldValue('primaryBreed', newValue)
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label='Primary Dog Breed'
                                  variant='outlined'
                                />
                              )}
                            />
                          </>
                        )}
                      </>
                    )}
                  </Grid>
                  {/* Secondary Breed */}
                  <Grid item xs={12} sm={6}>
                    {breedSelectionVisible && (
                      <>
                        {values.petType === 'Cat' ? (
                          <>
                            <Autocomplete
                              id='catBreed'
                              options={catBreeds}
                              getOptionLabel={option => option.name}
                              fullWidth
                              value={values.secondaryBreed}
                              onChange={(event, newValue) =>
                                setFieldValue('secondaryBreed', newValue)
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label='Secondary Cat Breed'
                                  variant='outlined'
                                />
                              )}
                            />
                          </>
                        ) : (
                          <>
                            <Autocomplete
                              id='dogBreed'
                              options={dogBreeds}
                              getOptionLabel={option => option.name}
                              fullWidth
                              value={values.secondaryBreed}
                              onChange={(event, newValue) =>
                                setFieldValue('secondaryBreed', newValue)
                              }
                              renderInput={params => (
                                <TextField
                                  {...params}
                                  label='Secondary Dog Breed'
                                  variant='outlined'
                                />
                              )}
                            />
                          </>
                        )}
                      </>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      border={`1px solid ${palette.neutral.medium}`}
                      borderRadius='5px'
                      p='1rem'
                    >
                      <Dropzone
                        acceptedFiles='.jpeg,.jpeg,.png'
                        multiple={true}
                        onDrop={acceptedFiles => {
                          setFieldValue('pictures', acceptedFiles);
                        }}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <Box
                            {...getRootProps()}
                            border={`2px dashed ${palette.primary.main}`}
                            p='1rem'
                            sx={{ '&:hover': { cursor: 'pointer' } }}
                          >
                            <input {...getInputProps()} />
                            {!values.pictures.length ? (
                              <Typography>Add Pictures Here</Typography>
                            ) : (
                              <FlexBetween>
                                <Typography>
                                  {values.pictures
                                    .map(image => image.name)
                                    .join(', ')}
                                </Typography>
                                <EditOutlinedIcon />
                              </FlexBetween>
                            )}
                          </Box>
                        )}
                      </Dropzone>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      placeholder='Pet Description'
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.petDescription}
                      name='petDescription'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      placeholder='Tags (coma separated)'
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.tags}
                      name='tags'
                    />
                  </Grid>

                  {/* Map */}
                  <Grid item xs={12}>
                    <MapComponent
                      userLocation={userLocation}
                      selectedLocation={selectedLocation}
                      onSelectLocation={handleLocationSelect}
                    />

                    {/* <TestMap /> */}
                  </Grid>
                </Grid>

                {/* BUTTONS */}
                <Box mt={2}>
                  <Button
                    fullWidth
                    type='submit'
                    sx={{
                      backgroundColor: '#6BBB52', //palette.primary.main,
                      color: 'white', //palette.background.alt,
                      '&:hover': '#6BBB5233', //{ color: palette.primary.main }
                      borderRadius: '60px'
                    }}
                  >
                    Create
                  </Button>
                </Box>
              </form>
            </Box>
          );
        }}
      </Formik>
    </>
  );
};

export default PetForm;
