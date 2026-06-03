import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/homePage';
import LoginPage from './pages/loginPage';
import ProfilePage from './pages/profilePage';
import { lazy, Suspense, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { themeSettings } from './theme';
import IsPrivate from './components/isPrivate';

import Hero from './pages/hero';
import IsLogged from './components/isLogged';
import Adoption from './pages/Adoption/Adoption';

import NoPage from './pages/404';
import TestMap from './components/TestMap';
import EditUser from './pages/EditUser';
import Loading from './components/Loading';

const Messenger = lazy(() => import('./pages/Messenger/Messenger'));
const PetDetailsApi = lazy(
  () => import('./pages/PetDetails/petDetailsApi/PetDetailsApi')
);
const PetDetailsV2 = lazy(
  () => import('./pages/PetDetails/myPetDetails/PetDetailsV2')
);
const GuestPetDetails = lazy(
  () => import('./pages/PetDetails/guestPetDetails/GuestPetDetails')
);
const CatBreedDetailsPage = lazy(
  () => import('./pages/CatBreeds/CatBreedDetailsPage')
);
const DogBreedDetailsPage = lazy(
  () => import('./pages/DogBreeds/DogBreedDetailsPage')
);

function App() {
  const mode = useSelector(state => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return (
    <div className='app'>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path='/' element={<Hero />} />

            <Route path='/test' element={<TestMap />} />

            <Route
              path='/auth'
              element={
                <IsLogged>
                  <LoginPage />
                </IsLogged>
              }
            />

            <Route
              path='/home'
              element={
                <IsPrivate>
                  <HomePage />{' '}
                </IsPrivate>
              }
            />

            <Route
              path='/breeds/cat-breeds/:breedName'
              element={<CatBreedDetailsPage />}
            />
            <Route
              path='/breeds/dog-breeds/:breedName'
              element={<DogBreedDetailsPage />}
            />
            <Route
              path='/users/:id'
              element={
                <IsPrivate>
                  <EditUser />
                </IsPrivate>
              }
            />

            <Route path='/pets' element={<Adoption />} />
            <Route path='/pets/:id' element={<PetDetailsV2 />} />
            <Route path='/pets/guest/:id' element={<GuestPetDetails />} />
            {/*  <Route path='/petsAPI/:id' element */}
            <Route path='/animals/:id' element={<PetDetailsApi />} />
            <Route
              path='/profile/:userId'
              element={
                <IsPrivate>
                  <ProfilePage />
                </IsPrivate>
              }
            />

            <Route
              path='/messenger'
              element={
                <IsPrivate>
                  <Messenger />
                </IsPrivate>
              }
            />
              <Route path='/*' element={<NoPage />} />
            </Routes>
          </Suspense>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
