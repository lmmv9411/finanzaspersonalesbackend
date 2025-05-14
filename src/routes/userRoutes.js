import express from 'express'

import { login, getByUser, register } from '../controllers/userController.js'

const router = express.Router()

router.get('/', getByUser)
router.post('/register', register)
router.post('/login', login)

export default router