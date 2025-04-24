import { DataTypes } from 'sequelize'
import { sequelize } from './index.js'
import { Category } from './category.js'

export const Movement = sequelize.define('Movement',
    {
        type: {
            type: DataTypes.ENUM('ingreso', 'gasto'),
            allowNull: false
        },
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
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    },
    {
        timestamps: true
    }
)

// Relación entre Movement y Category
Movement.belongsTo(Category)  // Cada movimiento está asociado a una categoría
Category.hasMany(Movement)   // Una categoría puede tener muchos movimientos
