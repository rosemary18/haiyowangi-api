const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Payment = require('./payment.model');

const Invoice = db.define('tbl_invoices', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.TEXT,
        defaultValue: ""
    },
    sales_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    payment_id: {
        type: DataTypes.BIGINT,
    },
    status: {
        type: DataTypes.DOUBLE
    },
    discount: {
        type: DataTypes.DOUBLE
    },
    sub_total: {
        type: DataTypes.DOUBLE
    },
    total: {
        type: DataTypes.DOUBLE
    },
    cash: {
        type: DataTypes.DOUBLE
    },
    change_money: {
        type: DataTypes.DOUBLE
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

Invoice.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });

module.exports = Invoice;