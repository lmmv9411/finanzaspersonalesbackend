import express from 'express'

import { getUser, login, logout, password, register, upload, uploadProfilePicture } from '../controllers/userController.js'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.post('/login', login)

router.post('/register', register)

router.use(auth)

router.get('/', getUser)
router.post('/logout', logout)
router.post('/upload-profile-pic', upload.single('image'), uploadProfilePicture)
router.post('/password', password)

export default router