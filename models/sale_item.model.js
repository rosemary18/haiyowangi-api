const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Product = require('./product.model');
const Variant = require('./variant.model');
const Packet = require('./packet.model');

const SaleItem = db.define('tbl_sale_items', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    sales_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    qty: {
        type: DataTypes.DOUBLE
    },
    product_id: {
        type: DataTypes.BIGINT
    },
    variant_id: {
        type: DataTypes.BIGINT
    },
    packet_id: {
        type: DataTypes.BIGINT
    },
    created_at: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    }
}, { timestamps: false });

SaleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
SaleItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });
SaleItem.belongsTo(Packet, { foreignKey: 'packet_id', as: 'packet' });

module.exports = SaleItem;
