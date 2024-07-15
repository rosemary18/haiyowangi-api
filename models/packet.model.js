const { DataTypes } = require('sequelize');
const db = require('../services/db');
const PacketItem = require('./packet_item.model');

const Packet = db.define('tbl_packets', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    price: {
        type: DataTypes.DOUBLE
    },
    is_published: {
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

Packet.hasMany(PacketItem, { foreignKey: 'packet_id', as: 'items' });
PacketItem.belongsTo(Packet, { foreignKey: 'packet_id', as: 'packet' });

module.exports = Packet;
