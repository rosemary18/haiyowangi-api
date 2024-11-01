
const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const { ingredientTriggers } = require('../../utils');
const abs_path = base_path + "/outgoing-stock"

// Handlers

const handlerSearchOutgoingStock = async (req, res) => {

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

        const outgoingStocks = await Models.OutgoingStock.findAll({
            where: filter,
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](outgoingStocks)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetAllOutgoingStocks = async (req, res) => {

    try {
        const outgoingStocks = await Models.OutgoingStock.findAll({
            include: [
                {
                    model: Models.OutgoingStockItem,
                    as: 'outgoing_stock_items',
                }
            ]
        })
        return res.response(RES_TYPES[200](outgoingStocks)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetOutgoingStock = async (req, res) => {

    const id = req.params.id
    
    try {
        const outgoingStock = await Models.OutgoingStock.findOne({
            where: { id },
            include: [
                {
                    model: Models.OutgoingStockItem,
                    as: 'outgoing_stock_items',
                    include: [
                        {
                            model: Models.Product,
                            as: 'product',
                            include: {
                                model: Models.Unit,
                                as: 'uom'
                            }
                        },
                        {
                            model: Models.Variant,
                            as: 'variant',
                            include: {
                                model: Models.Unit,
                                as: 'uom'
                            }
                        },
                        {
                            model: Models.Ingredient,
                            as: 'ingredient',
                            include: {
                                model: Models.Unit,
                                as: 'uom'
                            }
                        },
                    ]
                }
            ]
        })
    
        if (!outgoingStock) return res.response(RES_TYPES[400]('Stok keluar tidak ditemukan!')).code(400);
    
        return res.response(RES_TYPES[200](outgoingStock)).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500](error)).code(400);
    }
}

const handlerGetOutgoingStockByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const {
        search_text,
        order_by = 'id',
        order_type = 'DESC',
        page = 1,
        per_page = 15,
        start_date = null,
        end_date = null
    } = req.query

    
    const filter = { store_id: id }
    if (search_text) {
        filter[Op.or] = [
            { code: { [Op.like]: `%${search_text}%` } },
            { name: { [Op.like]: `%${search_text}%` } },
        ]
    }

    if (start_date || end_date) {
        filter['created_at'] = {
            [Op.between]: [ start_date, `${end_date} 23:59:59` ]
        }
    }

    const totalPages = Math.ceil((await Models.OutgoingStock.count({ where: filter })) / parseInt(per_page))
    const total = await Models.OutgoingStock.count({ where: filter })

    const outgoingStocks = await Models.OutgoingStock.findAll({
        where: filter,
        include: [
            {
                model: Models.OutgoingStockItem,
                as: 'outgoing_stock_items',
                include: [
                    {
                        model: Models.Product,
                        as: 'product',
                    },
                    {
                        model: Models.Variant,
                        as: 'variant',
                    }
                ]
            }
        ],
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!outgoingStocks) return res.response(RES_TYPES[400]('Stok keluar tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200]({
        outgoings_stock: outgoingStocks,
        total,
        current_page: parseInt(page),
        total_page: totalPages
    })).code(200);
}

const handlerGetAllOutgoingStockItems = async (req, res) => {

    try {
        const outgoingStockItems = await Models.OutgoingStockItem.findAll()
        return res.response(RES_TYPES[200](outgoingStockItems)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetOutgoingStockItem = async (req, res) => {
    
    try {
        const id = req.params.id
        const outgoingStockItem = await Models.OutgoingStockItem.findOne({
            where: { id },
            include: [
                {
                    model: Models.OutgoingStock,
                    as: 'outgoing_stock',
                    include: [
                        {
                            model: Models.Store,
                            as: 'store'
                        }
                    ]
                }
            ]
        })

        if (!outgoingStockItem) return res.response(RES_TYPES[400]('Item stok keluar tidak ditemukan!')).code(400);
        if (outgoingStockItem.outgoing_stock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

        return res.response(RES_TYPES[200](outgoingStockItem)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetOutgoingStockItemByOutgoingStock = async (req, res) => {
    
    const id = req.params.id
    const outgoingStock = await Models.OutgoingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store',
            }
        ]
    })

    if (!outgoingStock) return res.response(RES_TYPES[400]('Item stok keluar tidak ditemukan!')).code(400);
    if (outgoingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const outgoingStockItems = await Models.OutgoingStockItem.findAll({ where: { outgoing_stock_id: id } })

    if (!outgoingStockItems) return res.response(RES_TYPES[400]('Item stok keluar tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](outgoingStockItems)).code(200);
}

const handlerCreateOutgoingStock = async (req, res) => {

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

    const newOutgoingStock = {
        code: `OS${Date.now().toString()}`,
        store_id,
        name,
        status: 0
    }

    if (description) newOutgoingStock.description = description;

    const outgoingStock = await Models.OutgoingStock.create(newOutgoingStock);

    if (!outgoingStock) return res.response(RES_TYPES[400]('Stok keluar gagal ditambahkan!')).code(400);

    return res.response(RES_TYPES[200](outgoingStock, `Stok keluar baru telah ditambahkan`)).code(200);
}

const handlerAddOutgoingStockItem = async (req, res) => {
    
    const id = req.params.id
    const { items } = req.payload || {}

    if (!items) return res.response(RES_TYPES[400]('Item stok keluar harus diisi!')).code(400);
    if (!Array.isArray(items)) return res.response(RES_TYPES[400]('Item stok keluar harus berupa array!')).code(400);
    if (items.length == 0) return res.response(RES_TYPES[400]('Item stok keluar harus diisi!')).code(400);

    const outgoingStock = await Models.OutgoingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!outgoingStock) return res.response(RES_TYPES[400]('Stok keluar tidak ditemukan!')).code(400);
    if (outgoingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (outgoingStock.status == 1) return res.response(RES_TYPES[400](`Stok keluar ${outgoingStock.name} tidak dapat di ubah!`)).code(400);

    try {
        for (const item of items) {
            const newOutgoingStockItem = {
                outgoing_stock_id: outgoingStock.id,
                qty: item?.qty
            }
            if (item?.product_id) newOutgoingStockItem.product_id = item?.product_id
            if (item?.variant_id) newOutgoingStockItem.variant_id = item?.variant_id
            if (item?.ingredient_id) newOutgoingStockItem.ingredient_id = item?.ingredient_id
            await Models.OutgoingStockItem.create(newOutgoingStockItem);
        }
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item stok keluar ${outgoingStock.name} telah ditambahkan`)).code(200);
}

const handlerUpdateOutgoingStock = async (req, res) => {

    const id = req.params.id
    const {
        name,
        description,
        status
    } = req.payload || {}

    if (!name && !description && !status) return res.response(RES_TYPES[400]('Tidak ada data yang di ubah!')).code(400);

    const outgoingStock = await Models.OutgoingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
            {
                model: Models.OutgoingStockItem,
                as: 'outgoing_stock_items',
                include: [
                    {
                        model: Models.Product,
                        as: 'product'
                    },
                    {
                        model: Models.Variant,
                        as: 'variant'
                    },
                    {
                        model: Models.Ingredient,
                        as: 'ingredient'
                    }
                ]
            }
        ]
    })

    if (!outgoingStock) return res.response(RES_TYPES[400]('Stok keluar tidak ditemukan!')).code(400);
    if (outgoingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (outgoingStock.status == 1) return res.response(RES_TYPES[400](`Stok keluar ${outgoingStock.name} tidak dapat di ubah!`)).code(400);

    if (name) outgoingStock.name = name;
    if (description) outgoingStock.description = description;
    if (status) {
        if (status > 1) return res.response(RES_TYPES[400](`Status stok keluar yang anda berikan tidak valid!`)).code(400);
        if (status == 1 && outgoingStock.outgoing_stock_items.length == 0) {
            return res.response(RES_TYPES[400](`Stok keluar ${outgoingStock.name} tidak dapat di posting sebelum item stok keluar di tambahkan!`)).code(400);
        }
        outgoingStock.status = status;
    }

    try {
        if (outgoingStock.status == 1 && outgoingStock.outgoing_stock_items.length > 0) {
            for (const outgoingStockItem of outgoingStock.outgoing_stock_items) {
                if (outgoingStockItem.product_id && outgoingStockItem.product) {
                    if ((outgoingStockItem.product.qty - outgoingStockItem.qty) < 0) return res.response(RES_TYPES[400](`Gagal, jumlah stok keluar product ${outgoingStockItem.product.name} melebihi stok yang ada!`)).code(400);
                    await Models.Product.update(
                        {
                            qty: outgoingStockItem.product.qty - outgoingStockItem.qty
                        },
                        { where: { id: outgoingStockItem.product_id } }
                    )
                }
                if (outgoingStockItem.variant_id && outgoingStockItem.variant) {
                    if ((outgoingStockItem.variant.qty - outgoingStockItem.qty) < 0) return res.response(RES_TYPES[400](`Gagal, jumlah stok keluar variant ${outgoingStockItem.variant.name} melebihi stok yang ada!`)).code(400);
                    await Models.Variant.update(
                        {
                            qty: outgoingStockItem.variant.qty - outgoingStockItem.qty
                        },
                        { where: { id: outgoingStockItem.variant_id } }
                    )
                }
                // Call stock ingredient trigger
                if (outgoingStockItem.ingredient_id && outgoingStockItem.ingredient){
                    if ((outgoingStockItem.ingredient.qty - outgoingStockItem.qty) < 0) return res.response(RES_TYPES[400](`Gagal, jumlah stok keluar bahan ${outgoingStockItem.ingredient.name} melebihi stok yang ada!`)).code(400);
                    await Models.Ingredient.update(
                        {
                            qty: outgoingStockItem.ingredient.qty - outgoingStockItem.qty
                        },
                        { where: { id: outgoingStockItem.ingredient_id } }
                    )
                    ingredientTriggers([outgoingStockItem.ingredient_id], outgoingStock?.store_id)
                }
            }
        }
        outgoingStock.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:');
        await outgoingStock.save()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](outgoingStock, `Stok keluar ${outgoingStock.name} telah di ubah`)).code(200);
}

const handlerUpdateOutgoingStockItem = async (req, res) => {

    const id = req.params.id
    const { qty } = req.payload || {}

    if (!qty) return res.response(RES_TYPES[400]('Tidak ada data yang di ubah!')).code(400);

    const outgoingStockItem = await Models.OutgoingStockItem.findOne({
        where: { id },
        include: [
            {
                model: Models.OutgoingStock,
                as: 'outgoing_stock',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!outgoingStockItem) return res.response(RES_TYPES[400]('Item stok keluar tidak ditemukan!')).code(400);
    if (outgoingStockItem.outgoing_stock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (outgoingStockItem.outgoing_stock.status == 1) return res.response(RES_TYPES[400](`Stok keluar ${outgoingStockItem.outgoing_stock.name} tidak dapat di ubah!`)).code(400);

    const outgoingStock = await Models.OutgoingStock.findOne({
        where: { id: outgoingStockItem.outgoing_stock_id },
    })

    try {
        outgoingStockItem.qty = qty
        outgoingStock.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        await outgoingStockItem.save()
        await outgoingStock.save()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item stok keluar ${outgoingStock.name} telah di ubah`)).code(200);
}

const handlerDeleteOutgoingStockItem = async (req, res) => {
    
    const id = req.params.id
    const outgoingStockItem = await Models.OutgoingStockItem.findOne({
        where: { id },
        include: [
            {
                model: Models.OutgoingStock,
                as: 'outgoing_stock',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!outgoingStockItem) return res.response(RES_TYPES[400]('Item stok keluar tidak ditemukan!')).code(400);
    if (outgoingStockItem.outgoing_stock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        await outgoingStockItem.destroy()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item stok keluar ${outgoingStockItem.outgoing_stock.name} telah di hapus`)).code(200);
}

const handlerDeleteOutgoingStock = async (req, res) => { 

    const id = req.params.id
    const outgoingStock = await Models.OutgoingStock.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
            {
                model: Models.OutgoingStockItem,
                as: 'outgoing_stock_items'
            }
        ]
    })

    if (!outgoingStock) return res.response(RES_TYPES[400]('Stok keluar tidak ditemukan!')).code(400);
    if (outgoingStock.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (outgoingStock.status == 1) return res.response(RES_TYPES[400](`Stok keluar ${outgoingStock.name} tidak dapat di hapus!`)).code(400);

    try {
        if (outgoingStock.outgoing_stock_items?.length > 0) await Models.OutgoingStockItem.destroy({ where: { outgoing_stock_id: outgoingStock.id } })
        await outgoingStock.destroy()
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](`Stok keluar ${outgoingStock.name} telah dihapus`)).code(200);
}

module.exports = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchOutgoingStock
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllOutgoingStocks
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetOutgoingStock
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetOutgoingStockByStore
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/item',
        handler: handlerGetAllOutgoingStockItems
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/item/{id}',
        handler: handlerGetOutgoingStockItem
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}/item',
        handler: handlerGetOutgoingStockItemByOutgoingStock
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateOutgoingStock
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/{id}',
        handler: handlerAddOutgoingStockItem
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateOutgoingStock
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/item/{id}',
        handler: handlerUpdateOutgoingStockItem
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/item/{id}',
        handler: handlerDeleteOutgoingStockItem
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteOutgoingStock
    }
]