import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPet, updatePet, upload } from '../../api/pets.api';
import { Formik } from 'formik';
import {
  Box,
  Button,
  TextField,
  useMediaQuery,
  Typography,
  useTheme
} from '@mui/material';
import Dropzone from 'react-dropzone';
import EditOutlinedIconModule from '@mui/icons-material/EditOutlined';
import FlexBetween from '../../components/flexBetween';
import { resolveComponent } from '../../utils/componentInterop.js';

const EditOutlinedIcon = resolveComponent(EditOutlinedIconModule);

const EditPet = () => {
  const [petDescription, setPetDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [primaryBreed, setPrimaryBreed] = useState('');
  const [secondaryBreed, setSecondaryBreed] = useState('');
  const [tags, setTags] = useState([]);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { palette } = useTheme();
  const isNonMobile = useMediaQuery('(min-width: 600px)');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const response = await getPet(id);
        /*   setTitle(response.data.title);
        setDescription(response.data.description); */
        setPetDescription(response.data.petDescription);
        setPhotos(response.data.photos);
        setPetName(response.data.petName);
        setPetType(response.data.petType);
        setPrimaryBreed(response.data.primaryBreed);
        setSecondaryBreed(response.data.secondaryBreed);
        setTags(response.data.tags);
        setGender(response.data.gender);
        setAge(response.data.age);
      } catch (error) {
        console.log('An error ocurred fetching the project', error);
      }
    };

    fetchPet();
  }, [id]);

  const initialValues = {
    petDescription: petDescription,
    photos: photos,
    petName: petName,
    petType: petType,
    primaryBreed: primaryBreed,
    secondaryBreed: secondaryBreed,
    tags: tags,
    gender: gender,
    age: age
  };

  /*   const handleDescription = e => {
    setPetDescription(e.target.value);
  };
  const handlePhotos = e => {
    setPhotos(e.target.value);
  };
  const handleName = e => {
    setPetName(e.target.value);
  };
  const handleType = e => {
    setPetType(e.target.value);
  };
  const handlePrimaryBreed = e => {
    setPrimaryBreed(e.target.value);
  };
  const handleSecondaryBreed = e => {
    setSecondaryBreed(e.target.value);
  };
  const handleTags = e => {
    setTags(e.target.value);
  };
  const handleGender = e => {
    setGender(e.target.value);
  };
  const handleAge = e => {
    setAge(e.target.value);
  };
 */

  const handleSubmit = async (values, onSubmitProps) => {
    try {
      const updatedPet = {
        petDescription: values.petDescription,
        photos: values.photos,
        petName: values.petName,
        petType: values.petType,
        primaryBreed: values.primaryBreed,
        secondaryBreed: values.secondaryBreed,
        tags: values.tags,
        gender: values.gender,
        age: values.age
      };

      if (values.photos && values.photos.length > photos.length) {
        const newPhotos = values.photos.slice(photos.length);
        const uploadData = new FormData();
        newPhotos.forEach(file => uploadData.append('photos', file));
        const response = await upload(uploadData);
        updatedPet.photos = [...photos, ...response.data.fileUrls];
      }

      updatedPet.userId = userId;

      const responseUpdate = await updatePet(updatedPet);

      onSubmitProps.resetForm();
      if (responseUpdate) {
        navigate('/pets');
      }
    } catch (error) {
      console.log('Error Updating the Project', error);
    }
  };

  return (
    <>
      <Formik onSubmit={handleSubmit} initialValues={initialValues}>
        {({ values, handleBlur, handleChange, handleSubmit }) => (
          <Box>
            <Typography
              variant='h5'
              color='white'
              textAlign='center'
              fontWeight='bold'
              fontSize='2rem'
              mb='1rem'
            >
              {petName}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Box
                display='grid'
                gap='30px'
                gridTemplateColumns='repeat(4,minmax(0,1fr))'
                sx={{
                  '& > div': { gridColumn: isNonMobile ? undefined : 'span 4' }
                }}
              >
                <TextField
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.petName}
                  name='petName'
                  sx={{ gridColumn: 'span 2' }}
                />

                <TextField
                  autoComplete='last name'
                  autoFocus
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.petType}
                  name='petType'
                  sx={{ gridColumn: 'span 2' }}
                />
                <TextField
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.gender}
                  name='gender'
                  sx={{ gridColumn: 'span 4' }}
                />
                <TextField
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.age}
                  name='age'
                  sx={{ gridColumn: 'span 4' }}
                />
                <Box
                  gridColumn='span 4'
                  border={`1px solid ${palette.neutral.medium}`}
                  borderRadius='5px'
                  p='1rem'
                >
                  <Dropzone
                    acceptedFiles='.jpeg,.jpg,.png'
                    multiple={true}
                    onDrop={acceptedFiles => {
                      const newPhotos = acceptedFiles.filter(
                        file => !photos.some(photo => photo.name === file.name)
                      );
                      setPhotos([...photos, ...newPhotos]);
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
                        {!photos.length ? (
                          <Typography>Add Pictures Here</Typography>
                        ) : (
                          <FlexBetween>
                            {photos.map((photo, index) => (
                              <Typography key={index}>{photo.name}</Typography>
                            ))}
                            <EditOutlinedIcon />
                          </FlexBetween>
                        )}
                      </Box>
                    )}
                  </Dropzone>
                </Box>

                <TextField
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.petDescription}
                  name='petDescription'
                  sx={{ gridColumn: 'span 4' }}
                />
                <TextField
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.primaryBreed}
                  name='primaryBreed'
                  sx={{ gridColumn: 'span 4' }}
                />
                <TextField
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.secondaryBreed}
                  name='secondaryBreed'
                  sx={{ gridColumn: 'span 4' }}
                />
                <TextField
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.tags}
                  name='tags'
                  sx={{ gridColumn: 'span 4' }}
                />
              </Box>

              {/* BUTTONS */}
              <Box>
                <Button
                  fullWidth
                  type='submit'
                  sx={{
                    m: '2rem 0',
                    p: '1rem',
                    backgroundColor: '#6BBB52', //palette.primary.main,
                    color: 'white', //palette.background.alt,
                    '&:hover': '#6BBB5233', //{ color: palette.primary.main }
                    borderRadius: '60px'
                  }}
                >
                  {`Update ${petName}`}
                </Button>
              </Box>
            </form>
          </Box>
        )}
      </Formik>
    </>
  );
};

export default EditPet;
