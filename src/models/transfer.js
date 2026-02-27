import { DataTypes } from 'sequelize'
import { Account } from './account.js'
import { sequelize } from './index.js'
import { User } from './user.js'

export const Transfer = sequelize.define('Transfer', {
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
})

Transfer.belongsTo(User, {
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
})

User.hasMany(Transfer, {
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
})

Transfer.belongsTo(Account, {
  as: 'fromAccount',
  foreignKey: {
    name: 'fromAccountId',
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
})

Transfer.belongsTo(Account, {
  as: 'toAccount',
  foreignKey: {
    name: 'toAccountId',
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
})

Account.hasMany(Transfer, {
  as: 'outgoingTransfers',
  foreignKey: 'fromAccountId',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
})

Account.hasMany(Transfer, {
  as: 'incomingTransfers',
  foreignKey: 'toAccountId',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE'
})
