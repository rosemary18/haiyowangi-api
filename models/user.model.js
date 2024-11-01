const { DataTypes } = require('sequelize');
const db = require('../services/db');
const Store = require('./store.model');

const User = db.define('tbl_users', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(20)
    },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    profile_photo: {
        type: DataTypes.TEXT
    },
    address: {
        type: DataTypes.TEXT
    },
    privilege: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    refresh_token: {
        type: DataTypes.TEXT
    },
    reset_password_token: {
        type: DataTypes.TEXT
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

User.hasMany(Store, { foreignKey: 'owner_id', as: 'stores' });
Store.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

module.exports = User;
