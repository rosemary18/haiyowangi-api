const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');
const OutgoingStockItem = require('./outgoing_stock_item.model');

const OutgoingStock = db.define('tbl_outgoing_stocks', {
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
        type: DataTypes.TEXT
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

OutgoingStock.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
OutgoingStock.hasMany(OutgoingStockItem, { foreignKey: 'outgoing_stock_id', as: 'outgoing_stock_items' });
OutgoingStockItem.belongsTo(OutgoingStock, { foreignKey: 'outgoing_stock_id', as: 'outgoing_stock' });

module.exports = OutgoingStock;
