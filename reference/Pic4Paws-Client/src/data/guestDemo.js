import PawMin from '../assets/images/PawMin.png';
import PawOne from '../assets/images/PawONE.png';
import PawTwo from '../assets/images/PawTWO.png';
import DamaCat from '../assets/images/Nina.png';
import BeachHero from '../assets/images/beachHero1.png';

export const GUEST_USER_ID = 'guest-user';

export const guestFriends = [
  {
    _id: 'demo-user-maya',
    firstName: 'Maya',
    lastName: 'Silva',
    occupation: 'Volunteer Photographer',
    location: 'Lisbon',
    imgUrl: PawOne
  },
  {
    _id: 'demo-user-tomas',
    firstName: 'Tomas',
    lastName: 'Costa',
    occupation: 'Foster Family',
    location: 'Porto',
    imgUrl: PawTwo
  }
];

export const guestUser = {
  _id: GUEST_USER_ID,
  firstName: 'Guest',
  lastName: 'Explorer',
  email: 'guest@pic4paws.demo',
  location: 'Demo Session',
  occupation: 'Pic4Paws Visitor',
  imgUrl: PawMin,
  friends: guestFriends,
  viewedProfile: 24,
  impressions: 128
};

export const guestPosts = [
  {
    _id: 'demo-post-1',
    userId: 'demo-user-maya',
    firstName: 'Maya',
    lastName: 'Silva',
    description:
      'Meet Luna. She is shy for the first five minutes, then becomes the mayor of every room.',
    location: 'Lisbon Shelter Demo',
    imgUrl: DamaCat,
    userPicturePath: PawOne,
    likes: { 'demo-user-tomas': true },
    comments: [{ userId: 'demo-user-tomas', comment: 'She looks amazing!' }]
  },
  {
    _id: 'demo-post-2',
    userId: 'demo-user-tomas',
    firstName: 'Tomas',
    lastName: 'Costa',
    description:
      'A quiet walk, a soft sunset, and one very proud rescued companion.',
    location: 'Beach Walk Demo',
    imgUrl: BeachHero,
    userPicturePath: PawTwo,
    likes: { 'demo-user-maya': true, [GUEST_USER_ID]: true },
    comments: [{ userId: GUEST_USER_ID, comment: 'Saving this for later.' }]
  }
];
