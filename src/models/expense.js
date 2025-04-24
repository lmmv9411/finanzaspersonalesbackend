import { DataTypes } from 'sequelize'
import { sequelize } from './index.js'

export const Expense = sequelize.define('Expense', {
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  timestamps: true
})
