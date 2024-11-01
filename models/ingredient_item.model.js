const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Product = require('./product.model');
const Variant = require('./variant.model');
const Unit = require('./unit.model');

const IngredientItem = db.define('tbl_ingredient_items', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.BIGINT
    },
    variant_id: {
        type: DataTypes.BIGINT
    },
    ingredient_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    qty: {
        type: DataTypes.DOUBLE
    },
    unit_id: {
        type: DataTypes.BIGINT
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

IngredientItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
IngredientItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });
IngredientItem.belongsTo(Unit, { foreignKey: 'unit_id', as: 'uom' });

module.exports = IngredientItem;
