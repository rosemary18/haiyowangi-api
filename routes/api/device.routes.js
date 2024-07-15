const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/device"

// Handlers

const handlerGetAllDevices = async (req, res) => {

    try {
        const devices = await Models.Device.findAll()
        return res.response(RES_TYPES[200](devices)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetDevice = async (req, res) => {

    try {
        const id = req.params.id
        const device = await Models.Device.findOne({
            where: { id },
            include: [
                {
                    model: Models.Store,
                    as: 'store'
                }
            ]
        })

        if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

        return res.response(RES_TYPES[200](device)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetDevicesByStore = async (req, res) => {

    try {
        const id = req.params.id
        const store = await Models.Store.findOne({ where: { id } })

        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
        if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

        const {
            search_text,
            order_by = 'id',
            order_type = 'DESC',
            page = 1,
            per_page = 15
        } = req.query
    
        const filter = { store_id: id }
        if (search_text) {
            filter[Op.or] = [
                { device_id: { [Op.like]: `%${search_text}%` } },
            ]
        }

        const devices = await Models.Device.findAll({ 
            where: filter,
            order: [[order_by, order_type]],
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
         })

        if (!devices) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);
        return res.response(RES_TYPES[200](devices)).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(500);
    }
}

const handlerDelete = async (req, res) => {

    try {
        const id = req.params.id
        const device = await Models.Device.findOne({
            where: { id },
            include: [
                {
                    model: Models.Store,
                    as: 'store'
                }
            ]
        })
        if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);
        if (device.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

        await device.destroy()

        return res.response(RES_TYPES[200](null, `Device ${device.token_id} di hapus`)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

module.exports = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllDevices
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetDevice
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetDevicesByStore
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDelete
    },
]