const { DataTypes } = require('sequelize');
const db = require('../services/db');
const OfficeInventory = require('./office_inventory.model');
const Staff = require('./staff.model');
const Packet = require('./packet.model');

const Store = db.define('tbl_stores', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT
    },
    store_image: {
        type: DataTypes.TEXT
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    last_sync: {
        type: DataTypes.DATE,
    },
    owner_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'tbl_users',
            key: 'id'
        }
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

Store.hasMany(OfficeInventory, { foreignKey: 'store_id', as: 'office_inventories' });
Store.hasMany(Staff, { foreignKey: 'store_id', as: 'staffs' });
OfficeInventory.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Staff.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Store.hasMany(Packet, { foreignKey: 'store_id', as: 'packets' });
Packet.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = Store;