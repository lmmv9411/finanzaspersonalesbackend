import { DataTypes } from 'sequelize'
import { sequelize } from './index.js'

export const Category = sequelize.define('Category',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        }
    },
    {
        timestamps: true
    }
)