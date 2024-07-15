const { DataTypes } = require('sequelize');
const db = require('../services/db');
const VariantItem = require('./variant_item.model');

const VariantTypeItem = db.define('tbl_variant_type_items', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT
    },
    variant_type_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

VariantTypeItem.hasMany(VariantItem, { foreignKey: 'variant_type_item_id', as: 'variants' });
VariantItem.belongsTo(VariantTypeItem, { foreignKey: 'variant_type_item_id', as: 'variant_type_item' });

module.exports = VariantTypeItem;