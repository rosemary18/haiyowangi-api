const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Unit = require('./unit.model');

const Ingredient = db.define('tbl_ingredients', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    img: {
        type: DataTypes.TEXT
    },
    qty: {
        type: DataTypes.DOUBLE
    },
    unit_id: {
        type: DataTypes.BIGINT
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

Ingredient.belongsTo(Unit, { foreignKey: 'unit_id', as: 'uom' });

module.exports = Ingredient;
