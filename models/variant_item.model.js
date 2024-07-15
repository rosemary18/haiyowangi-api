const { DataTypes } = require('sequelize');
const db = require('../services/db');

const VariantItem = db.define('tbl_variant_items', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    variant_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    variant_type_item_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

module.exports = VariantItem;