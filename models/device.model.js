const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');

const Device = db.define('tbl_devices', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    device_id: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    store_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    last_sync: {
        type: DataTypes.DATE,
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

Store.hasMany(Device, { foreignKey: 'store_id', as: 'devices' });
Device.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = Device;