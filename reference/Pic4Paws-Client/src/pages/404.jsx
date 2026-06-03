import NotFound from '../components/404page';
import HomeNav from '../components/HomeNav';

const NoPage = () => {
  return (
    <>
      <HomeNav flex='none' />
      <NotFound />
    </>
  );
};

export default NoPage;
