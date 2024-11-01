const { DataTypes } = require('sequelize');
const db = require('../services/db');

const Staff = db.define('tbl_staffs', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.TEXT,
    },
    name: {
        type: DataTypes.TEXT,
    },
    email: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING(20)
    },
    profile_photo: {
        type: DataTypes.TEXT
    },
    address: {
        type: DataTypes.TEXT
    },
    date_joined: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.INTEGER
    },
    salary: {
        type: DataTypes.DOUBLE
    },
    pos_passcode: {
        type: DataTypes.STRING(8)
    },
    is_cashier: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    created_at: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    },
    updated_at: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
    }
}, { timestamps: false });

module.exports = Staff;
