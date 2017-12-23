import express from 'express';
import { read, write } from 'crypto-io-utils';

const api = express();

api.get('/api/login', (request, response) => {
  response.send('hello world\n From REVC PI');
});

api.listen(80, () => console.log('listening on port 80'));
