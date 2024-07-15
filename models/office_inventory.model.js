const { DataTypes } = require('sequelize');
const db = require('../services/db');

const OfficeInventory = db.define('tbl_office_inventories', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.DOUBLE
    },
    buy_date: {
        type: DataTypes.DATE
    },
    qty: {
        type: DataTypes.DOUBLE
    },
    goods_condition: {
        type: DataTypes.INTEGER
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

module.exports = OfficeInventory;
