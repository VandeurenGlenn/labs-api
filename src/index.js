import ioExpress from './io-express.js'
import serverkeys from './serverkeys.js';
import shared from './routes/shared.js';
import auth from './routes/auth.js';

(async () => {
  const keys = await serverkeys();
  const {express, io} = ioExpress();

  express.use(shared);
  express.use(auth);

  express.get('/', (request, response) => {
    response.send('hello world\n From REVC PI');
  });
})();
