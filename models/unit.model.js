const { DataTypes } = require('sequelize');
const db = require('../services/db');

const Unit = db.define('tbl_units', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    symbol: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    base_unit_symbol: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    conversion_factor_to_base: {
        type: DataTypes.DOUBLE,
        defaultValue: false
    },
    created_at: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    }
}, { timestamps: false });

module.exports = Unit;
