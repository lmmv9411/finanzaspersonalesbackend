import express from 'express'
import { auth } from '../middlewares/auth.js'

const router = express.Router()

router.get('/check', auth, (_, res) => {
    res.json({ ok: true })
})

export default router
