const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/incoming-stock"

// Handlers

const handlerSearchIncomingStock = async (req, res) => {

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

        const filter = {
            store_id,
            [Op.or]: [
                { code: { [Op.like]: `%${search_text}%` } },
                { name: { [Op.like]: `%${search_text}%` } },
            ]
        }        

        const incomingStocks = await Models.IncomingStock.findAll({
            where: filter,
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](incomingStocks)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetlAllIncomingStocks = async (req, res) => {

    try {
        const incomingStocks = await Models.IncomingStock.findAll({
            include: [
                {
                    model: Models.IncomingStockItem,
                    as: 'incoming_stock_items',
                }
            ]
        })
        return res.response(RES_TYPES[200](incomingStocks)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetIncomingStock = async (req, res) => {

    const id = req.params.id
    const incomingStock = await Models.IncomingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.IncomingStockItem,
                as: 'incoming_stock_items',
            }
        ]
    })

    if (!incomingStock) return res.response(RES_TYPES[400]('Stok masuk tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](incomingStock)).code(200);
}

const handlerGetIncomingStockByStore = async (req, res) => {

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
            { code: { [Op.like]: `%${search_text}%` } },
            { name: { [Op.like]: `%${search_text}%` } },
        ]
    }

    const incomingStocks = await Models.IncomingStock.findAll({
        where: filter,
        include: [
            {
                model: Models.IncomingStockItem,
                as: 'incoming_stock_items',
            }
        ],
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!incomingStocks) return res.response(RES_TYPES[400](`Stok masuk di toko ${store.name} tidak ditemukan!`)).code(400);

    return res.response(RES_TYPES[200](incomingStocks)).code(200);
}

const handlerGetAllIncomingStockItems = async (req, res) => {

    try {
        const incomingStockItems = await Models.IncomingStockItem.findAll()
        return res.response(RES_TYPES[200](incomingStockItems)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetIncomingStockItem = async (req, res) => {

    const id = req.params.id
    const incomingStockItem = await Models.IncomingStockItem.findOne({ where: { id } })

    if (!incomingStockItem) return res.response(RES_TYPES[400]('Stok masuk tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](incomingStockItem)).code(200);
}

const handlerGetIncomingStockItemByIncomingStock = async (req, res) => {

    const id = req.params.id
    const incomingStock = await Models.IncomingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store',
            }
        ]
    })

    if (!incomingStock) return res.response(RES_TYPES[400]('Stok masuk tidak ditemukan!')).code(400);
    if (incomingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const incomingStockItems = await Models.IncomingStockItem.findAll({ where: { incoming_stock_id: id } })

    if (!incomingStockItems) return res.response(RES_TYPES[400]('Stok masuk tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](incomingStockItems)).code(200);
}

const handlerCreateIncomingStock = async (req, res) => {

    const {
        store_id,
        name,
        description
    } = req.payload || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);
    if (!name) return res.response(RES_TYPES[400]('Nama harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newIncomingStock = {
        code: `IS${Date.now().toString()}`,
        store_id,
        name,
        status: 0
    }

    if (description) newIncomingStock.description = description;

    const incomingStock = await Models.IncomingStock.create(newIncomingStock);

    if (!incomingStock) return res.response(RES_TYPES[400]('Stok masuk gagal ditambahkan!')).code(400);

    return res.response(RES_TYPES[200](incomingStock, `Stok masuk baru telah ditambahkan`)).code(200);
}

const handlerDeleteIncomingStockItem = async (req, res) => {
    
    const id = req.params.id
    const incomingStockItem = await Models.IncomingStockItem.findOne({
        where: { id },
        include: [
            {
                model: Models.IncomingStock,
                as: 'incoming_stock',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!incomingStockItem) return res.response(RES_TYPES[400]('Item stok masuk tidak ditemukan!')).code(400);
    if (incomingStockItem.incoming_stock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        await incomingStockItem.destroy()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item stok masuk ${incomingStockItem.incoming_stock.name} telah di hapus`)).code(200);
}

const handlerAddIncomingStockItem = async (req, res) => {
    
    const id = req.params.id
    const { items } = req.payload || {}

    if (!items) return res.response(RES_TYPES[400]('Item stok masuk harus diisi!')).code(400);
    if (!Array.isArray(items)) return res.response(RES_TYPES[400]('Item stok masuk harus berupa array!')).code(400);
    if (items.length == 0) return res.response(RES_TYPES[400]('Item stok masuk harus diisi!')).code(400);

    const incomingStock = await Models.IncomingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!incomingStock) return res.response(RES_TYPES[400]('Stok masuk tidak ditemukan!')).code(400);
    if (incomingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (incomingStock.status == 1) return res.response(RES_TYPES[400](`Stok masuk ${incomingStock.name} tidak dapat di ubah!`)).code(400);

    try {
        for (const item of items) {
            const newIncomingStockItem = {
                incoming_stock_id: incomingStock.id,
                qty: item?.qty
            }
            if (item?.product_id) newIncomingStockItem.product_id = item?.product_id
            if (item?.variant_id) newIncomingStockItem.variant_id = item?.variant_id
            await Models.IncomingStockItem.create(newIncomingStockItem);
        }
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item stok masuk ${incomingStock.name} telah ditambahkan`)).code(200);
}

const handlerUpdateIncomingStockItem = async (req, res) => {

    const id = req.params.id
    const { qty } = req.payload || {}

    if (!qty) return res.response(RES_TYPES[400]('Tidak ada data yang di ubah!')).code(400);

    const incomingStockItem = await Models.IncomingStockItem.findOne({
        where: { id },
        include: [
            {
                model: Models.IncomingStock,
                as: 'incoming_stock',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!incomingStockItem) return res.response(RES_TYPES[400]('Item stok masuk tidak ditemukan!')).code(400);
    if (incomingStockItem.incoming_stock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (incomingStockItem.incoming_stock.status == 1) return res.response(RES_TYPES[400](`Stok masuk ${incomingStockItem.incoming_stock.name} tidak dapat di ubah!`)).code(400);

    const incomingStock = await Models.IncomingStock.findOne({
        where: { id: incomingStockItem.incoming_stock_id },
    })

    try {
        incomingStockItem.qty = qty
        incomingStock.updated_at = new Date()
        await incomingStockItem.save()
        await incomingStock.save()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item stok masuk ${incomingStock.name} telah di ubah`)).code(200);
}

const handlerUpdateIncomingStock = async (req, res) => {

    const id = req.params.id
    const {
        name,
        description,
        status
    } = req.payload || {}

    if (!name && !description && !status) return res.response(RES_TYPES[400]('Tidak ada data yang di ubah!')).code(400);

    const incomingStock = await Models.IncomingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
            {
                model: Models.IncomingStockItem,
                as: 'incoming_stock_items',
                include: [
                    {
                        model: Models.Product,
                        as: 'product'
                    },
                    {
                        model: Models.Variant,
                        as: 'variant'
                    }
                ]
            }
        ]
    })

    if (!incomingStock) return res.response(RES_TYPES[400]('Stok masuk tidak ditemukan!')).code(400);
    if (incomingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (incomingStock.status == 1) return res.response(RES_TYPES[400](`Stok masuk ${incomingStock.name} tidak dapat di ubah!`)).code(400);

    if (name) incomingStock.name = name;
    if (description) incomingStock.description = description;
    if (status) {
        if (status > 1) return res.response(RES_TYPES[400](`Status stok masuk yang anda berikan tidak valid!`)).code(400);
        if (status == 1 && incomingStock.incoming_stock_items.length == 0) {
            return res.response(RES_TYPES[400](`Stok masuk ${incomingStock.name} tidak dapat di posting sebelum item stok masuk di tambahkan!`)).code(400);
        }
        incomingStock.status = status;
    }

    try {
        if (incomingStock.status == 1 && incomingStock.incoming_stock_items.length > 0) {
            for (const incomingStockItem of incomingStock.incoming_stock_items) {
                if (incomingStockItem.product_id && incomingStockItem.product) {
                    await Models.Product.update(
                        {
                            qty: incomingStockItem.product.qty + incomingStockItem.qty
                        },
                        { where: { id: incomingStockItem.product_id } }
                    )
                }
                if (incomingStockItem.variant_id && incomingStockItem.variant) {
                    await Models.Variant.update(
                        {
                            qty: incomingStockItem.variant.qty + incomingStockItem.qty
                        },
                        { where: { id: incomingStockItem.variant_id } }
                    )
                }
            }
        }
        incomingStock.updated_at = new Date();
        await incomingStock.save()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](incomingStock, `Stok masuk ${incomingStock.name} telah di ubah`)).code(200);
}

const handlerDeleteIncomingStock = async (req, res) => { 

    const id = req.params.id
    const incomingStock = await Models.IncomingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
            {
                model: Models.IncomingStockItem,
                as: 'incoming_stock_items',
            }
        ]
    })

    if (!incomingStock) return res.response(RES_TYPES[400]('Stok masuk tidak ditemukan!')).code(400);
    if (incomingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (incomingStock.status == 1) return res.response(RES_TYPES[400](`Stok masuk ${incomingStock.name} tidak dapat di hapus!`)).code(400);

    try {
        if (incomingStock.incoming_stock_items?.length > 0) await Models.IncomingStockItem.destroy({ where: { incoming_stock_id: incomingStock.id } })
        await incomingStock.destroy()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](`Stok masuk ${incomingStock.name} telah dihapus`)).code(200);
}

module.exports = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchIncomingStock
    },
    {
        path: abs_path,
        method: FETCH_REQUEST_TYPES.GET,
        handler: handlerGetlAllIncomingStocks
    },
    {
        path: abs_path + "/{id}",
        method: FETCH_REQUEST_TYPES.GET,
        handler: handlerGetIncomingStock
    },
    {
        path: abs_path + "/store/{id}",
        method: FETCH_REQUEST_TYPES.GET,
        handler: handlerGetIncomingStockByStore
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/item",
        handler: handlerGetAllIncomingStockItems
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/item/{id}",
        handler: handlerGetIncomingStockItem
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/{id}/item",
        handler: handlerGetIncomingStockItemByIncomingStock
    },
    {
        path: abs_path,
        method: FETCH_REQUEST_TYPES.POST,
        handler: handlerCreateIncomingStock
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + "/{id}",
        handler: handlerAddIncomingStockItem
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + "/{id}",
        handler: handlerUpdateIncomingStock
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + "/item/{id}",
        handler: handlerUpdateIncomingStockItem
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + "/item/{id}",
        handler: handlerDeleteIncomingStockItem
    },
    {
        path: abs_path + "/{id}",
        method: FETCH_REQUEST_TYPES.DELETE,
        handler: handlerDeleteIncomingStock
    }
]