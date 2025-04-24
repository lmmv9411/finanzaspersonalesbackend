import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { testConnection, sequelize } from './models/index.js'
import expenseRoutes from './routes/expenseRoutes.js'
import movementRoutes from './routes/movementRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'

dotenv.config()

const app = express()
app.use(cors())

app.use(express.json())

app.use('/api/expenses', expenseRoutes)
app.use('/api/movements', movementRoutes)
app.use('/api/categories', categoryRoutes)

const startServer = async () => {
    await testConnection()
    await sequelize.sync()  // crea tablas si no existen
    app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'))
}

startServer()
