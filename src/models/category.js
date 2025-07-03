import { DataTypes } from 'sequelize'
import { sequelize } from './index.js'
import { User } from './user.js'

export const Category = sequelize.define('Category',
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('ingreso', 'gasto'),
            allowNull: false
        },
    },
    {
        timestamps: true
    }
)

User.hasMany(Category, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
})
Category.belongsTo(User, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
})

