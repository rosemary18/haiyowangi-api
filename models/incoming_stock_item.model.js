const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Product = require('./product.model');
const Variant = require('./variant.model');
const Ingredient = require('./ingredient.model');

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

IncomingStockItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
IncomingStockItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });
IncomingStockItem.belongsTo(Ingredient, { foreignKey: 'ingredient_id', as: 'ingredient' });

module.exports = IncomingStockItem;
