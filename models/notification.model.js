const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');

const Notification = db.define('tbl_notifications', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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

Notification.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = Notification;