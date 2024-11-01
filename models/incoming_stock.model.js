const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');
const IncomingStockItem = require('./incoming_stock_item.model');

const IncomingStock = db.define('tbl_incoming_stocks', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.TEXT,
        defaultValue: ""
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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

IncomingStock.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
IncomingStock.hasMany(IncomingStockItem, { foreignKey: 'incoming_stock_id', as: 'incoming_stock_items' });
IncomingStockItem.belongsTo(IncomingStock, { foreignKey: 'incoming_stock_id', as: 'incoming_stock' });

module.exports = IncomingStock;
