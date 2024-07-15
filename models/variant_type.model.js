const { DataTypes } = require('sequelize');
const db = require('../services/db');
const VariantTypeItem = require('./variant_type_item.model');

const VariantType = db.define('tbl_variant_types', {
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
    created_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

VariantType.hasMany(VariantTypeItem, { foreignKey: 'variant_type_id', as: 'variants' });
VariantTypeItem.belongsTo(VariantType, { foreignKey: 'variant_type_id', as: 'variant_type' });

module.exports = VariantType;