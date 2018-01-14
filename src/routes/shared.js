import { Router } from 'express';
import helmet from 'helmet';
import cors from 'cors';
const router = Router();

router.use(helmet());

router.use(cors({
  origin: 'http://localhost:9000'
}));

export default router;
