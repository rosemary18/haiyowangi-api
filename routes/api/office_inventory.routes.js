const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/office-inventory"

// Handlers

const handlerSearchOfficeInventory = async (req, res) => {

    try {

        const {
            search_text,
            store_id,
            page = 1,
            per_page = 15
        } = req.query

        if (!store_id) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

        const store = await Models.Store.findOne({ where: { id: store_id } })
        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
        if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

        if (!search_text) return res.response(RES_TYPES[200]([])).code(200);

        const totalPages = Math.ceil((await Models.OfficeInventory.count({ where: { store_id, name: { [Op.like]: `%${search_text}%` } } })) / parseInt(per_page))

        const OfficeInventories = await Models.OfficeInventory.findAll({
            where: {
                store_id,
                [Op.or]: [
                    { name: { [Op.like]: `%${search_text}%` } },
                ]
            },
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200]({
            data: OfficeInventories,
            current_page: parseInt(page),
            total_page: totalPages
        })).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetOfficeInventories = async (req, res) => {
    
    const office_inventories = await Models.OfficeInventory.findAll()
    return res.response(RES_TYPES[200](office_inventories)).code(200);
}

const handlerGetOfficeInventory = async (req, res) => {

    const id = req.params.id
    const office_inventory = await Models.OfficeInventory.findOne({ where: { id } })

    if (!office_inventory) return res.response(RES_TYPES[400]('Office Inventory tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](office_inventory)).code(200);
}

const handlerGetOfficeInventoriesByStore = async (req, res) => {

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
        const searchs = search_text.split(' ');
        const ors = searchs.map(search => ({ name: { [Op.like]: `%${search}%` } }));
        filter[Op.or] = ors;
    }

    const totalPages = Math.ceil((await Models.OfficeInventory.count({ where: filter })) / parseInt(per_page))

    const office_inventories = await Models.OfficeInventory.findAll({
        where: filter,
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
     })

    if (!office_inventories) return res.response(RES_TYPES[400]('Office Inventory tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200]({
        data: office_inventories,
        current_page: parseInt(page),
        total_page: totalPages
    })).code(200);
}

const handlerCreateOfficeInventory = async (req, res) => {

    const { 
        store_id,
        name,
        price,
        buy_date,
        qty,
        goods_condition
    } = req.payload || {}

    if (!store_id || !name || !price || !buy_date || !qty || !goods_condition) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newOfficeInventory = {
        store_id,
        name,
        price,
        buy_date,
        qty,
        goods_condition
    }

    const office_inventory = await Models.OfficeInventory.create(newOfficeInventory).catch(err => console.log(err));

    if (!office_inventory) return res.response(RES_TYPES[400]('Office Inventory gagal ditambahkan!')).code(400);

    return res.response(RES_TYPES[200](office_inventory)).code(200);
}

const handlerUpdateOfficeInventory = async (req, res) => {

    const id = req.params.id
    const office_inventory = await Models.OfficeInventory.findOne({ where: { id } })

    if (!office_inventory) return res.response(RES_TYPES[400]('Office Inventory tidak ditemukan!')).code(400);

    const store = await Models.Store.findOne({ where: { id: office_inventory.store_id } })
    
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const { name, price, buy_date, qty, goods_condition } = req.payload || {}

    if (name) office_inventory.name = name
    if (price) office_inventory.price = price
    if (buy_date) office_inventory.buy_date = buy_date
    if (qty) office_inventory.qty = qty
    if (goods_condition) office_inventory.goods_condition = goods_condition

    office_inventory.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:');
    office_inventory.save()

    return res.response(RES_TYPES[200](office_inventory.toJSON(), 'Office Inventory berhasil diperbarui')).code(200);
}

const handlerDeleteOfficeInventory = async (req, res) => {
    
    const id = req.params.id
    const office_inventory = await Models.OfficeInventory.findOne({ where: { id } })

    if (!office_inventory) return res.response(RES_TYPES[400]('Office Inventory tidak ditemukan!')).code(400);

    const store = await Models.Store.findOne({ where: { id: office_inventory.store_id } })
    
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    office_inventory.destroy()

    return res.response(RES_TYPES[200](null, 'Office Inventory berhasil di hapus')).code(200);
}

// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchOfficeInventory
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetOfficeInventories,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetOfficeInventory,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetOfficeInventoriesByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateOfficeInventory
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateOfficeInventory
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteOfficeInventory
    },
]

module.exports = routes