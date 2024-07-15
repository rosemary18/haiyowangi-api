const { DataTypes } = require('sequelize');
const db = require('../services/db');

const Discount = db.define('tbl_discounts', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50)
    },
    code: {
        type: DataTypes.STRING(50)
    },
    nominal: {
        type: DataTypes.DOUBLE
    },
    percentage: {
        type: DataTypes.DOUBLE
    },
    is_percentage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    date_valid: {
        type: DataTypes.DATE
    },
    valid_until: {
        type: DataTypes.DATE
    },
    multiplication: {
        type: DataTypes.INTEGER
    },
    max_items_qty: {
        type: DataTypes.DOUBLE
    },
    min_items_qty: {
        type: DataTypes.DOUBLE
    },
    special_for_product_id: {
        type: DataTypes.BIGINT
    },
    special_for_variant_id: {
        type: DataTypes.BIGINT
    },
    special_for_packet_id: {
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

module.exports = Discount;
