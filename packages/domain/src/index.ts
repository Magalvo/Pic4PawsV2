export type AdoptionStatus = 'available' | 'pending' | 'adopted';
export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'other';

export type Shelter = {
  id: string;
  name: string;
  partnerLevel: 'shelter-partner' | 'verified-rescue';
  city: string;
  state: string;
  monthlyDonations: number;
  activeSponsors: number;
};

export type MedicalStatus = {
  vaccinated: boolean;
  sterilized: boolean;
  energyLevel: 'low' | 'medium' | 'high';
};

export type SponsorshipGoal = {
  currentAmount: number;
  targetAmount: number;
  label: string;
};

export type PetProfile = {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: string;
  gender: 'female' | 'male' | 'unknown';
  location: string;
  shelterId: string;
  status: AdoptionStatus;
  imageUrl: string;
  description: string;
  tags: string[];
  likes: number;
  comments: number;
  sponsorship: SponsorshipGoal;
  medical: MedicalStatus;
};

export type FeedPost = {
  id: string;
  petId: string;
  shelterId: string;
  caption: string;
  distanceMiles: number;
  createdAt: string;
};

export type NewPetDraft = {
  name?: string;
  species?: PetSpecies;
  age?: string;
  breed?: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
};

export type PetPublishValidation = {
  valid: boolean;
  missingFields: Array<keyof NewPetDraft>;
};

const requiredPetDraftFields = ['name', 'species', 'age', 'breed', 'description', 'imageUrl'] as const;

export const sponsorshipProgress = ({ currentAmount, targetAmount }: SponsorshipGoal): number => {
  if (targetAmount <= 0) {
    return 0;
  }

  const progress = (currentAmount / targetAmount) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
};

export const validatePetPublishDraft = (draft: NewPetDraft): PetPublishValidation => {
  const missingFields = requiredPetDraftFields.filter((field) => {
    const value = draft[field];
    return value === undefined || value === '';
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

export const shelters: Shelter[] = [
  {
    id: 'happy-tails',
    name: 'Happy Tails Sanctuary',
    partnerLevel: 'shelter-partner',
    city: 'Austin',
    state: 'TX',
    monthlyDonations: 4250,
    activeSponsors: 128,
  },
  {
    id: 'paws-claws',
    name: 'Paws & Claws Rescue',
    partnerLevel: 'verified-rescue',
    city: 'Seattle',
    state: 'WA',
    monthlyDonations: 2910,
    activeSponsors: 84,
  },
];

export const pets: PetProfile[] = [
  {
    id: 'buddy',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    age: '2 years old',
    gender: 'male',
    location: 'Austin, TX',
    shelterId: 'happy-tails',
    status: 'available',
    imageUrl: '/images/buddy.jpeg',
    description:
      'Buddy has the biggest heart. He loves tennis balls, long walks and greeting every volunteer like an old friend.',
    tags: ['GoodWithCats', 'HighEnergy', 'HouseTrained'],
    likes: 1248,
    comments: 42,
    sponsorship: {
      currentAmount: 210,
      targetAmount: 300,
      label: 'Monthly medical & nutrition fund',
    },
    medical: {
      vaccinated: true,
      sterilized: true,
      energyLevel: 'high',
    },
  },
  {
    id: 'luna',
    name: 'Luna',
    species: 'cat',
    breed: 'Domestic Shorthair',
    age: '1 year old',
    gender: 'female',
    location: 'Round Rock, TX',
    shelterId: 'paws-claws',
    status: 'available',
    imageUrl: '/images/luna.jpeg',
    description:
      'Luna is quiet, curious and happiest when she can watch the world from a sunny window.',
    tags: ['Quiet', 'IndoorOnly'],
    likes: 856,
    comments: 18,
    sponsorship: {
      currentAmount: 75,
      targetAmount: 250,
      label: 'Calm-room enrichment fund',
    },
    medical: {
      vaccinated: true,
      sterilized: false,
      energyLevel: 'medium',
    },
  },
  {
    id: 'max',
    name: 'Max',
    species: 'dog',
    breed: 'Beagle Mix',
    age: '6 years old',
    gender: 'male',
    location: 'Austin, TX',
    shelterId: 'happy-tails',
    status: 'available',
    imageUrl: '/images/max.jpeg',
    description: 'Max is a gentle senior who likes slow walks, soft beds and patient people.',
    tags: ['SeniorDog', 'LovesKids'],
    likes: 391,
    comments: 9,
    sponsorship: {
      currentAmount: 180,
      targetAmount: 180,
      label: 'Senior wellness fund',
    },
    medical: {
      vaccinated: true,
      sterilized: true,
      energyLevel: 'low',
    },
  },
  {
    id: 'snowball',
    name: 'Snowball',
    species: 'rabbit',
    breed: 'New Zealand Rabbit',
    age: '8 months old',
    gender: 'unknown',
    location: 'Seattle, WA',
    shelterId: 'paws-claws',
    status: 'pending',
    imageUrl: '/images/snowball.jpeg',
    description: 'Snowball needs a quiet home and a family ready to keep a careful feeding routine.',
    tags: ['SmallPet', 'Vegetarian'],
    likes: 214,
    comments: 5,
    sponsorship: {
      currentAmount: 40,
      targetAmount: 150,
      label: 'Special diet support',
    },
    medical: {
      vaccinated: false,
      sterilized: false,
      energyLevel: 'medium',
    },
  },
];

export const feedPosts: FeedPost[] = pets.slice(0, 2).map((pet, index) => ({
  id: `${pet.id}-feed`,
  petId: pet.id,
  shelterId: pet.shelterId,
  caption: `Meet ${pet.name}! ${pet.description}`,
  distanceMiles: index === 0 ? 2 : 5,
  createdAt: new Date(Date.UTC(2026, 5, 1 - index)).toISOString(),
}));

export const findPetById = (petId: string): PetProfile | undefined =>
  pets.find((pet) => pet.id === petId);

export const findShelterById = (shelterId: string): Shelter | undefined =>
  shelters.find((shelter) => shelter.id === shelterId);
