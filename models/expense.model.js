const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');

const Expense = db.define('tbl_expenses', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.TEXT,
        defaultValue: ""
    },
    name: {
        type: DataTypes.TEXT
    },
    nominal: {
        type: DataTypes.DOUBLE
    },
    tag: {
        type: DataTypes.STRING(50)
    },
    description: {
        type: DataTypes.TEXT
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

Expense.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = Expense;
