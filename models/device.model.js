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
        type: DataTypes.STRING,
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

Store.hasMany(Device, { foreignKey: 'store_id', as: 'devices' });
Device.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = Device;