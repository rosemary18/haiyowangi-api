const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');

const Income = db.define('tbl_incomes', {
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
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    },
    updated_at: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    }
}, { timestamps: false });

Income.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = Income;
