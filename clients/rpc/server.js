import express from 'express';
import { json, urlencoded } from 'body-parser';
import cors from 'cors';
import router from './routes';

const app = express();

app.use(cors());

app.use(json());
app.use(urlencoded({ extended: true }));

app.use(router);

export default function start(port) {
  app.listen(port, () => {});
}
