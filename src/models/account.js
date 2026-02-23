import { DataTypes } from "sequelize";
import { sequelize } from "./index.js";
import { User } from "./user.js";

export const Account = sequelize.define('Account', {
    name: {
        type: DataTypes.STRING,
        required: true,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        required: true,
        allowNull: false
    },
    initialBalance: {
        type: DataTypes.DECIMAL(10, 2),
        required: true,
        allowNull: false,
        defaultValue: 0
    },
    description: {
        type: DataTypes.STRING,
        required: false
    }
}, {
    timestamps: true
})

Account.belongsTo(User, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
})

User.hasMany(Account, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
})