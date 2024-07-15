const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Product = require('./product.model');
const Variant = require('./variant.model');

const IncomingStockItem = db.define('tbl_incoming_stock_items', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    incoming_stock_id: {
        type: DataTypes.BIGINT,
    },
    product_id: {
        type: DataTypes.BIGINT,
    },
    variant_id: {
        type: DataTypes.BIGINT
    },
    qty: {
        type: DataTypes.DOUBLE
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

IncomingStockItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
IncomingStockItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });

module.exports = IncomingStockItem;
