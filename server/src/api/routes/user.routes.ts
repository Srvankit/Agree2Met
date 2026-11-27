import { Router } from 'express';
import multer from 'multer';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get('/profile', userController.getProfile);
userRouter.put('/profile', userController.updateProfile);
userRouter.post('/avatar', upload.single('avatar'), userController.uploadAvatar);
userRouter.put('/password', userController.changePassword);
userRouter.post('/export-data', userController.exportUserData);
userRouter.delete('/account', userController.deleteAccount);
