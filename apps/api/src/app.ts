import cors from 'cors';
import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import { feedPosts, findPetById, findShelterById, pets, shelters } from '@pic4paws/domain';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok', service: 'pic4paws-api' });
  });

  app.get('/pets', (_request: Request, response: Response) => {
    response.json({ pets });
  });

  app.get('/pets/:petId', (request: Request, response: Response) => {
    const petId = request.params.petId;

    if (!petId || Array.isArray(petId)) {
      response.status(400).json({ message: 'Pet id is required' });
      return;
    }

    const pet = findPetById(petId);

    if (!pet) {
      response.status(404).json({ message: 'Pet not found' });
      return;
    }

    response.json({ pet });
  });

  app.get('/shelters', (_request: Request, response: Response) => {
    response.json({ shelters });
  });

  app.get('/feed', (_request: Request, response: Response) => {
    const posts = feedPosts.map((post) => ({
      ...post,
      pet: findPetById(post.petId),
      shelter: findShelterById(post.shelterId),
    }));

    response.json({ posts });
  });

  return app;
};
