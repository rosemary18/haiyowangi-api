const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Unit = require('./unit.model');
const VariantItem = require('./variant_item.model');

const Variant = db.define('tbl_variants', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    name: {
        type: DataTypes.TEXT
    },
    img: {
        type: DataTypes.TEXT
    },
    description: {
        type: DataTypes.TEXT
    },
    buy_price: {
        type: DataTypes.DOUBLE
    },
    qty: {
        type: DataTypes.DOUBLE
    },
    price: {
        type: DataTypes.DOUBLE
    },
    unit_id: {
        type: DataTypes.BIGINT
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
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

Variant.belongsTo(Unit, { foreignKey: 'unit_id', as: 'uom' });
Variant.hasMany(VariantItem, { foreignKey: 'variant_id', as: 'variants' });
VariantItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });

module.exports = Variant;
