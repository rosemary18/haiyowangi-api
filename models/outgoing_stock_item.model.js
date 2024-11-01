const { DataTypes } = require('sequelize');
const db = require('../services/db');

const OutgoingStockItem = db.define('tbl_outgoing_stock_items', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    outgoing_stock_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    product_id: {
        type: DataTypes.BIGINT
    },
    variant_id: {
        type: DataTypes.BIGINT
    },
    ingredient_id: {
        type: DataTypes.BIGINT
    },
    ingredient_id: {
        type: DataTypes.BIGINT
    },
    qty: {
        type: DataTypes.DOUBLE
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

module.exports = OutgoingStockItem;
