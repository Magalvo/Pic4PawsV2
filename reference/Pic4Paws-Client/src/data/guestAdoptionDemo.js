const guestPetTemplates = [
  {
    name: 'Luna',
    type: 'Cat',
    age: '2 years',
    gender: 'Female',
    breed: 'Domestic Shorthair',
    location: 'Lisbon Shelter Demo',
    description:
      'Luna is calm, curious, and warms up quickly once she feels safe. She is looking for a quiet home with soft windowsills.',
    tags: ['gentle', 'house-trained', 'low-maintenance']
  },
  {
    name: 'Milo',
    type: 'Dog',
    age: '1 year',
    gender: 'Male',
    breed: 'Mixed Breed',
    location: 'Porto Rescue Demo',
    description:
      'Milo is a playful young dog who loves fetch, short walks, and people who will celebrate every small victory with him.',
    tags: ['playful', 'good with kids', 'social']
  },
  {
    name: 'Nina',
    type: 'Cat',
    age: '4 years',
    gender: 'Female',
    breed: 'Tabby Mix',
    location: 'Coastal Foster Demo',
    description:
      'Nina prefers a predictable routine, sunny spots, and a home that appreciates a very serious biscuit-making schedule.',
    tags: ['independent', 'quiet home', 'affectionate']
  },
  {
    name: 'Bento',
    type: 'Dog',
    age: '3 years',
    gender: 'Male',
    breed: 'Labrador Mix',
    location: 'Shelter Friend Demo',
    description:
      'Bento is an easygoing companion who enjoys car rides, steady routines, and meeting new people at his own pace.',
    tags: ['calm', 'trainable', 'family friendly']
  },
  {
    name: 'Olive',
    type: 'Cat',
    age: '6 months',
    gender: 'Female',
    breed: 'Calico Mix',
    location: 'Happy Tails Demo',
    description:
      'Olive is a bright kitten with endless curiosity, a dramatic leap, and the confidence of a cat twice her size.',
    tags: ['kitten', 'curious', 'high energy']
  },
  {
    name: 'Teddy',
    type: 'Dog',
    age: '5 years',
    gender: 'Male',
    breed: 'Retriever Mix',
    location: 'Demo Adoption Center',
    description:
      'Teddy is a steady, affectionate dog who likes predictable routines, long sniff walks, and leaning gently into his people.',
    tags: ['affectionate', 'mellow', 'leash trained']
  }
];

const fallbackImage =
  'https://user-images.githubusercontent.com/194400/49531010-48dad180-f8b1-11e8-8d89-1e61320e1d82.png';

export const GUEST_ADOPTION_STORAGE_KEY = 'guestAdoptionPets';

export const buildGuestAdoptionPets = (catImages = [], dogImages = []) => {
  let catIndex = 0;
  let dogIndex = 0;

  return guestPetTemplates.map((template, index) => {
    const imageUrl =
      template.type === 'Cat'
        ? catImages[catIndex++] || fallbackImage
        : dogImages[dogIndex++] || fallbackImage;

    return {
      id: `guest-pet-${index + 1}`,
      isGuestDemo: true,
      name: template.name,
      type: template.type,
      species: template.type,
      age: template.age,
      gender: template.gender,
      breed: template.breed,
      description: template.description,
      tags: template.tags,
      location: template.location,
      status: 'adoptable',
      published_at: new Date(Date.now() - index * 86400000).toISOString(),
      breeds: {
        primary: template.breed,
        secondary: null,
        mixed: true,
        unknown: false
      },
      contact: {
        address: {
          city: template.location
        }
      },
      primary_photo_cropped: {
        medium: imageUrl
      },
      photos: [
        {
          large: imageUrl,
          medium: imageUrl,
          small: imageUrl
        }
      ]
    };
  });
};

export const readStoredGuestAdoptionPets = () => {
  try {
    const storedPets = sessionStorage.getItem(GUEST_ADOPTION_STORAGE_KEY);
    return storedPets ? JSON.parse(storedPets) : [];
  } catch {
    return [];
  }
};