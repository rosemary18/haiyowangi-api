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
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    },
    updated_at: {
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    }
}, { timestamps: false });

module.exports = Payment;
