import { useState } from 'react';
import { Box, IconButton, useBreakpointValue } from '@chakra-ui/react';
import { BiLeftArrowAlt, BiRightArrowAlt } from 'react-icons/bi';
import ReactSlick from 'react-slick';

const Slider = ReactSlick?.default || ReactSlick;

const settings = {
  dots: true,
  arrows: false,
  fade: true,
  infinite: true,
  autoplay: true,
  speed: 500,
  autoplaySpeed: 5000,
  slidesToShow: 1,
  slidesToScroll: 1
};

export default function Carousel({ cards, previewOpacity = 0.5 }) {
  const [slider, setSlider] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const top = useBreakpointValue({ base: '90%', md: '50%' });
  const side = useBreakpointValue({ base: '30%', md: '10px' });
  const handleBeforeChange = (current, next) => {
    setCurrentSlide(next);
  };

  return (
    <Box
      position={'relative'}
      height={'600px'}
      width={'full'}
      overflow={'hidden'}
      backgroundColor='#539ce9' //#00D5FA
      margin={0}
    >
      <link
        rel='stylesheet'
        type='text/css'
        href='https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick.min.css'
      />
      <link
        rel='stylesheet'
        type='text/css'
        href='https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.6.0/slick-theme.min.css'
      />
      <IconButton
        aria-label='left-arrow'
        colorScheme='messenger'
        borderRadius='full'
        position='absolute'
        left={side}
        top={top}
        transform={'translate(0%, -50%)'}
        zIndex={2}
        onClick={() => slider?.slickPrev()}
      >
        <BiLeftArrowAlt />
      </IconButton>
      <IconButton
        aria-label='right-arrow'
        colorScheme='messenger'
        borderRadius='full'
        position='absolute'
        right={side}
        top={top}
        transform={'translate(0%, -50%)'}
        zIndex={2}
        onClick={() => slider?.slickNext()}
      >
        <BiRightArrowAlt />
      </IconButton>
      <Slider {...settings} ref={setSlider} beforeChange={handleBeforeChange}>
        {cards.map((url, index) => (
          <Box
            key={index}
            height={'600px'}
            width={'100%'}
            position='relative'
            backgroundPosition='center'
            backgroundRepeat='no-repeat'
            backgroundSize='contain'
            backgroundImage={`url(${url})`}
          />
        ))}
      </Slider>
      {cards.length > 1 && (
        <>
          <Box
            position='absolute'
            height={'600px'}
            width={'50%'}
            left={0}
            opacity={currentSlide === 0 ? 0 : previewOpacity}
            backgroundImage={`url(${cards[currentSlide - 1]})`}
            backgroundSize='contain'
            backgroundPosition='center'
            backgroundRepeat='no-repeat'
          />
          <Box
            position='absolute'
            height={'600px'}
            width={'50%'}
            right={0}
            opacity={currentSlide === cards.length - 1 ? 0 : previewOpacity}
            backgroundImage={`url(${cards[currentSlide + 1]})`}
            backgroundSize='contain'
            backgroundPosition='center'
            backgroundRepeat='no-repeat'
          />
        </>
      )}
    </Box>
  );
}
