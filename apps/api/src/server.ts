import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 6001);
const app = createApp();

app.listen(port, () => {
  console.info(`Pic4Paws API listening on port ${port}`);
});
