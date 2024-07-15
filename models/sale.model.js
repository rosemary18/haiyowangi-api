const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Discount = require('./discount.model');
const PaymentType = require('./payment_type.model');
const Store = require('./store.model');
const Staff = require('./staff.model');
const SaleItem = require('./sale_item.model');
const Invoice = require('./invoice.model');

const Sale = db.define('tbl_sales', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.TEXT,
        defaultValue: ""
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total: {
        type: DataTypes.DOUBLE
    },
    discount_id: {
        type: DataTypes.BIGINT
    },
    payment_type_id: {
        type: DataTypes.BIGINT
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    staff_id: {
        type: DataTypes.BIGINT
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

Sale.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Sale.belongsTo(Discount, { foreignKey: 'discount_id', as: 'discount' });
Sale.belongsTo(PaymentType, { foreignKey: 'payment_type_id', as: 'payment_type' });
Sale.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });
Sale.hasMany(SaleItem, { foreignKey: 'sales_id', as: 'items' });
Sale.hasOne(Invoice, { foreignKey: 'sales_id', as: 'invoice' });
Invoice.belongsTo(Sale, { foreignKey: 'sales_id', as: 'sale' });

module.exports = Sale;
