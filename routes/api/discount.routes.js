const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/discount"

// Handlers

const handlerSearchDiscount = async (req, res) => {

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

        const discounts = await Models.Discount.findAll({
            where: {
                store_id,
                [Op.or]: [
                    { code: { [Op.like]: `%${search_text}%` } },
                    { name: { [Op.like]: `%${search_text}%` } },
                ]
            },
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](discounts)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetDiscounts = async (req, res) => {
    
    const discounts = await Models.Discount.findAll()
    return res.response(RES_TYPES[200](discounts)).code(200);
}

const handlerGetDiscount = async (req, res) => {

    const id = req.params.id
    const discount = await Models.Discount.findOne({ where: { id } })

    if (!discount) return res.response(RES_TYPES[400]('Diskon tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](discount)).code(200);
}

const handlerGetDiscountsByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

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

    const discounts = await Models.Discount.findAll({
        where: filter,
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!discounts) return res.response(RES_TYPES[400]('Diskon tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](discounts)).code(200);
}

const handlerCreateDiscount = async (req, res) => {

    const {
        store_id,
        name,
        code,
        nominal,
        percentage,
        is_percentage,
        date_valid,
        valid_until,
        multiplication,
        max_items_qty,
        min_items_qty,
        special_for_product_id,
        special_for_variant_id,
        special_for_packet_id,
    } = req.payload || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);
    if (!name) return res.response(RES_TYPES[400]('Nama harus diisi!')).code(400);
    if (!code) return res.response(RES_TYPES[400]('Kode harus diisi!')).code(400);
    if (!date_valid) return res.response(RES_TYPES[400]('Waktu berlaku diskon harus diisi!')).code(400);
    if (!valid_until) return res.response(RES_TYPES[400]('Waktu berlaku diskon harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newDiscount = {
        store_id,
        name,
        code,
        nominal: nominal || 0,
        percentage: percentage || 0,
        is_percentage: is_percentage || false,
        date_valid,
        valid_until,
        multiplication: multiplication || 0,
        max_items_qty: max_items_qty || 0,
        min_items_qty: min_items_qty || 0,
    }

    if (special_for_product_id) newDiscount.special_for_product_id = special_for_product_id
    if (special_for_variant_id) newDiscount.special_for_variant_id = special_for_variant_id
    if (special_for_packet_id) newDiscount.special_for_packet_id = special_for_packet_id

    let discount
    
    try {
        discount = await Models.Discount.create(newDiscount)
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400]('Diskon gagal dibuat')).code(400);
    }

    if (!discount) return res.response(RES_TYPES[400]('Diskon gagal dibuat')).code(400);

    return res.response(RES_TYPES[200](discount, "Diskon baru telah dibuat")).code(200);
}

const handlerUpdateDiscount = async (req, res) => {

    const id = req.params.id
    const {
        name,
        code,
        nominal,
        percentage,
        is_percentage,
        date_valid,
        valid_until,
        max_items_qty,
        min_items_qty,
        special_for_product_id,
        special_for_variant_id,
        special_for_packet_id,
    } = req.payload || {}

    if (
        !name &&
        !code &&
        !nominal &&
        !percentage &&
        is_percentage == undefined &&
        !date_valid &&
        !valid_until &&
        !max_items_qty &&
        !min_items_qty &&
        !special_for_product_id &&
        !special_for_variant_id &&
        !special_for_packet_id
    ) return res.response(RES_TYPES[400]('Masukkan data yang ingin di ubah')).code(400);

    const discount = await Models.Discount.findOne({ where: { id } })

    if (!discount) return res.response(RES_TYPES[400]('Diskon tidak ditemukan!')).code(400);

    const store = await Models.Store.findOne({ where: { id: discount.store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name != undefined) discount.name = name
    if (code != undefined) discount.code = code
    if (nominal != undefined) discount.nominal = nominal
    if (percentage != undefined) discount.percentage = percentage
    if (is_percentage != undefined) discount.is_percentage = is_percentage
    if (date_valid != undefined) discount.date_valid = date_valid
    if (valid_until != undefined) discount.valid_until = valid_until
    if (max_items_qty != undefined) discount.max_items_qty = max_items_qty
    if (min_items_qty != undefined) discount.min_items_qty = min_items_qty
    if (special_for_product_id != undefined) discount.special_for_product_id = special_for_product_id
    if (special_for_variant_id != undefined) discount.special_for_variant_id = special_for_variant_id
    if (special_for_packet_id != undefined) discount.special_for_packet_id = special_for_packet_id

    const isUpdated = await discount.save()

    if (!isUpdated) return res.response(RES_TYPES[400]('Diskon gagal di ubah')).code(400);

    return res.response(RES_TYPES[200](discount, "Diskon telah di ubah")).code(200);
}

const handlerDeleteDiscount = async (req, res) => {

    const id = req.params.id
    const discount = await Models.Discount.findOne({ where: { id } })

    if (!discount) return res.response(RES_TYPES[400]('Diskon tidak ditemukan!')).code(400);

    const store = await Models.Store.findOne({ where: { id: discount.store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    // Check is discount is used
    const sales_used_dicount = await Models.Sale.findAll({ where: { discount_id: id } })
    if (sales_used_dicount.length > 0) return res.response(RES_TYPES[400]('Diskon yang sudah dugunakan tidak dapat di hapus!')).code(400);

    const isDeleted = await discount.destroy()
    if (!isDeleted) return res.response(RES_TYPES[400]('Diskon gagal dihapus!')).code(400);
    return res.response(RES_TYPES[200]('Diskon berhasil dihapus')).code(200);
}

// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchDiscount
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetDiscounts
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetDiscount
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetDiscountsByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateDiscount
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateDiscount
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteDiscount
    },
]

module.exports = routes