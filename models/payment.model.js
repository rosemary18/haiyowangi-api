const { DataTypes } = require('sequelize');
const db = require('../services/db');

const Payment = db.define('tbl_payments', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.TEXT,
        defaultValue: ""
    },
    account_bank: {
        type: DataTypes.TEXT
    },
    account_number: {
        type: DataTypes.STRING(50)
    },
    receiver_account_bank: {
        type: DataTypes.TEXT
    },
    receiver_account_number: {
        type: DataTypes.STRING(50)
    },
    img: {
        type: DataTypes.STRING(255)
    },
    nominal: {
        type: DataTypes.DOUBLE
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

module.exports = Payment;
