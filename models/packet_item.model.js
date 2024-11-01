const { DataTypes } = require('sequelize');
const db = require('../services/db');

const PacketItem = db.define('tbl_packet_items', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    packet_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    product_id: {
        type: DataTypes.BIGINT
    },
    variant_id: {
        type: DataTypes.BIGINT
    },
    qty: {
        type: DataTypes.DOUBLE
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

module.exports = PacketItem;
