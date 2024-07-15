const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');
const Unit = require('./unit.model');
const Variant = require('./variant.model');
const VariantType = require('./variant_type.model');
const Discount = require('./discount.model');

const Product = db.define('tbl_products', {
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
    description: {
        type: DataTypes.TEXT
    },
    qty: {
        type: DataTypes.DOUBLE
    },
    buy_price: {
        type: DataTypes.DOUBLE
    },
    price: {
        type: DataTypes.DOUBLE
    },
    has_variants: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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

Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'uom' });
Product.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Product.hasMany(Variant, { foreignKey: 'product_id', as: 'variants' });
Product.hasMany(VariantType, { foreignKey: 'product_id', as: 'variant_types' });
Variant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
VariantType.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = Product;
