import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { sequelize, testConnection } from './models/index.js'
import categoryRoutes from './routes/categoryRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import statsRoutes from './routes/statsRoutes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/expenses', expenseRoutes)
app.use('/api/movements', movementRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/stats', statsRoutes)

const _dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(express.static(path.join(_dirname, 'public')))

app.get(/\/(.*)/, (req, res) => {
    res.sendFile(path.join(_dirname, 'public', 'index.html'))
});


const startServer = async () => {
    await testConnection()
    await sequelize.sync()  // crea tablas si no existen
    app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'))
}

startServer()
