import { useContext, useState } from "react";
import {
  Box,
  Button,
  TextField,
  useMediaQuery,
  Typography,
  useTheme,
} from "@mui/material";
import EditOutlinedIconModule from "@mui/icons-material/EditOutlined";
import { Formik } from "formik";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Dropzone from "react-dropzone";
import FlexBetween from "../../components/flexBetween";
import { AuthContext } from "../../context/auth.context.jsx";

import { signInEmailPassword } from "../../config/firebase.config.js";
import { setUser } from "../../state/index.js";

import { upload, signin, signup } from "../../api/auth.api";
import { resolveComponent } from "../../utils/componentInterop.js";

const EditOutlinedIcon = resolveComponent(EditOutlinedIconModule);

const initialValuesRegister = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  location: "",
  occupation: "",
  picture: "",
};

const initialValuesLogin = {
  email: "",
  password: "",
};

const Form = () => {
  const { startGuestSession } = useContext(AuthContext);
  const [pageType, setPageType] = useState("login");
  const { palette } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isNonMobile = useMediaQuery("(min-width: 600px)");
  const isLogin = pageType === "login";
  const isRegister = pageType === "register";

  const register = async (values, onSubmitProps) => {
    try {
      const newUser = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        location: values.location,
        occupation: values.occupation,
        picture: values.picture,
      };

      if (newUser.picture) {
        // Upload the image to Cloudinary
        const uploadData = new FormData();
        uploadData.append("file", newUser.picture);
        const response = await upload(uploadData);
        // Save the Cloudinary image URL instead of the file
        newUser.imgUrl = response.data.fileUrl;
      }

      const savedUserResponse = await signup(newUser);
      const savedUser = savedUserResponse.data;
      onSubmitProps.resetForm();

      if (savedUser) {
        setPageType("login");
      }
    } catch (error) {
      // Handle the error here
      console.log("Error On User Registration", error);
    }
  };

  const login = async (values) => {
    try {
      const user = {
        email: values.email,
        password: values.password,
      };

      const response = await signin(user);

      const firebaseCredential = await signInEmailPassword(
        response.data.authToken,
      );
      const firebaseToken = await firebaseCredential.user.getIdToken();
      localStorage.setItem("authToken", firebaseToken);

      const loggedInUser = response.data.userId;

      // Store the user ID in localStorage
      localStorage.setItem("userId", loggedInUser);

      dispatch(
        setUser({
          isLoggedIn: true,
          isLoading: false,
          user: response.data.user,
          authToken: firebaseToken,
          friends: response.data.friends,
        }),
      );
      //loggedIn.user contains the user information
      // The authToken is passed as loggedIn.authToken
      navigate("/home");
    } catch (error) {
      console.error("Error login in", error);
    }
  };

  const handleFormSubmit = async (values, onSubmitProps) => {
    if (isLogin) await login(values, onSubmitProps);
    if (isRegister) await register(values, onSubmitProps);
  };

  const handleGuestSession = () => {
    startGuestSession();
    navigate("/home");
  };

  return (
    <>
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={isLogin ? initialValuesLogin : initialValuesRegister}
      >
        {({
          values,
          handleBlur,
          handleChange,
          handleSubmit,
          setFieldValue,
          resetForm,
        }) => (
          <Box>
            <Box>
              {isLogin && (
                <Button
                  fullWidth
                  type="button"
                  onClick={handleGuestSession}
                  sx={{
                    mt: "1rem",
                    mb: "1rem",
                    p: "0.85rem",
                    backgroundColor: "#6BBB52",
                    color: "white",
                    borderRadius: "60px",
                    fontWeight: "bold",
                    "&:hover": {
                      backgroundColor: "#f4f7ff",
                      color: "#6BBB52",
                    },
                  }}
                >
                  Continue as Guest
                </Button>
              )}
            </Box>
            <hr style={{ margin: "2rem 0" }} />
            <Typography
              variant="h5"
              color="white"
              textAlign="center"
              fontWeight="bold"
              fontSize="2rem"
              mb="1rem"
            >
              {isRegister ? "Sign Up" : "Sign In"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gap="30px"
                gridTemplateColumns="repeat(4,minmax(0,1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                }}
              >
                {isRegister && (
                  <>
                    <TextField
                      required
                      label="First Name"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.firstName}
                      name="firstName"
                      sx={{ gridColumn: "span 2" }}
                    />

                    <TextField
                      required
                      autoComplete="last name"
                      autoFocus
                      label="Last Name"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.lastName}
                      name="lastName"
                      sx={{ gridColumn: "span 2" }}
                    />
                    <TextField
                      required
                      label="Location"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.location}
                      name="location"
                      sx={{ gridColumn: "span 4" }}
                    />
                    <TextField
                      required
                      label="Occupation"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.occupation}
                      name="occupation"
                      sx={{ gridColumn: "span 4" }}
                    />
                    <Box
                      gridColumn="span 4"
                      border={`1px solid ${palette.neutral.medium}`}
                      borderRadius="5px"
                      p="1rem"
                    >
                      <Dropzone
                        acceptedFiles=".jpeg,.jpeg,.png"
                        multiple={false}
                        onDrop={(acceptedFiles) => {
                          setFieldValue("picture", acceptedFiles[0]);
                        }}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <Box
                            {...getRootProps()}
                            border={`2px dashed ${palette.primary.main}`}
                            p="1rem"
                            sx={{ "&:hover": { cursor: "pointer" } }}
                          >
                            <input {...getInputProps()} />
                            {!values.picture ? (
                              <Typography>Add Picture Here</Typography>
                            ) : (
                              <FlexBetween>
                                <Typography>{values.picture.name}</Typography>
                                <EditOutlinedIcon />
                              </FlexBetween>
                            )}
                          </Box>
                        )}
                      </Dropzone>
                    </Box>
                  </>
                )}

                <TextField
                  required
                  label="Email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  name="email"
                  sx={{ gridColumn: "span 4" }}
                />
                <TextField
                  required
                  label="Password"
                  type="password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.password}
                  name="password"
                  sx={{ gridColumn: "span 4" }}
                />
              </Box>

              {/* BUTTONS */}
              <Box>
                <Button
                  fullWidth
                  type="submit"
                  sx={{
                    m: "2rem 0",
                    p: "1rem",
                    backgroundColor: "#6BBB52", //palette.primary.main,
                    color: "white", //palette.background.alt,
                    "&:hover": "#6BBB5233", //{ color: palette.primary.main }
                    borderRadius: "60px",
                  }}
                >
                  {isLogin ? "LOGIN" : "REGISTER"}
                </Button>
                <Typography
                  onClick={() => {
                    setPageType(isLogin ? "register" : "login");
                    resetForm();
                  }}
                  sx={{
                    textDecoration: "underline",
                    color: "white", //palette.primary.main,
                    "&:hover": {
                      cursor: "pointer",
                      color: "#6BBB52", //palette.primary.light
                    },
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {isLogin ? (
                    <>
                      Don&apos;t have an account? <span>Sign Up</span>
                    </>
                  ) : (
                    "Already have an account? Login Here"
                  )}
                </Typography>
              </Box>
            </form>
          </Box>
        )}
      </Formik>
      {/* <Box
        sx={{
          justifyContent: 'space-evenly',
          mt: '1rem',
          mb: '1rem'
        }}
      >
        <Button
          onClick={handleGoogleAuthentication}
          fullWidth
          startIcon={<Icon />}
          sx={{
            backgroundColor: 'white',
            color: 'black'
          }}
        >
          Login With Google
        </Button>
      </Box>{' '} */}
    </>
  );
};

export default Form;
