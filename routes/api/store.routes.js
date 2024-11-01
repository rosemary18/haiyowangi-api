const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { sendEmail, Uploader } = require('../../utils');
const fs = require('fs');
const Path = require('path');
const { Op } = require('sequelize');
const abs_path = base_path + "/store"

// Handlers

const handlerSearchStore = async (req, res) => {

    try {

        const {
            search_text,
            page = 1,
            per_page = 15
        } = req.query
        if (!search_text) return res.response(RES_TYPES[200]([])).code(200);

        const stores = await Models.Store.findAll({
            where: {
                owner_id: req.auth.credentials?.user?.id,
                [Op.or]: [
                    { name: { [Op.like]: `%${search_text}%` } },
                ]
            },
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](stores)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }
}

const handlerGetStores = async (req, res) => {
    
    const stores = await Models.Store.findAll()
    return res.response(RES_TYPES[200](stores)).code(200);
}

const handlerGetStoresByUser = async (req, res) => {
    
    const id = req.params.id

    if (req.auth.credentials?.user?.id != id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const {
        search_text,
        order_by = 'id',
        order_type = 'DESC',
        page = 1,
        per_page = 15
    } = req.query

    const filter = { owner_id: id, is_active: true }
    if (search_text) {
        filter[Op.or] = [
            { name: { [Op.like]: `%${search_text}%` } },
        ]
    }

    const stores = await Models.Store.findAll({ 
        where: filter,
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
     })

    if (!stores) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](stores)).code(200);
}

const handlerGetStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({
        where: { id },
        include: [
            {
                model: Models.User,
                as: 'owner'
            },
            {
                model: Models.OfficeInventory,
                as: 'office_inventories'
            }
        ]
    })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200](store)).code(200);
}

const handlerCreateStore = async (req, res) => {

    const { name, address, phone } = req.payload || {}

    if (!name) return res.response(RES_TYPES[400]('Nama harus diisi')).code(400);

    const newStore = {
        name,
        owner_id: req.auth.credentials?.user?.id
    }
    if (address) newStore.address = address
    if (phone) newStore.phone = phone

    let store;

    try {
        store = await Models.Store.create(newStore)
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    // Send email
    sendEmail(
        req.auth.credentials?.user?.email,
        'Toko baru',
        `Hallo, Toko ${store.name} baru saja ditambahkan`
    );

    return res.response(RES_TYPES[200](store, 'Toko berhasil ditambahkan')).code(200);
}

const handlerUpdateStore = async (req, res) => {
    
    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const { name, address, phone, description } = req.payload || {}

    if (name) store.name = name
    if (address) store.address = address
    if (phone) store.phone = phone
    if (description) store.description = description

    store.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:');
    store.save()

    return res.response(RES_TYPES[200](store, 'Toko berhasil diperbarui')).code(200);
}

const handlerUpdateStorePhoto = async (req, res) => {
    
    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    if (req.auth.credentials?.user?.id != store.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const img_name = await Uploader(req.payload.file);

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    if (store.store_image) {
        const img_name = store.store_image.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
    }

    try {
        store.store_image = req?.url?.origin + '/images/' + img_name
        store.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:');
        store.save();
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](store, "Upload gambar sukses")).code(200);
}

const handlerDeleteStore = async (req, res) => {
    
    const id = req.params.id

    if (req.auth.credentials?.user?.id != id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    store.is_active = false
    store.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:');
    store.save()

    // Send email
    sendEmail(
        store.owner?.email,
        'Toko di hapus',
        `Hallo, ${store.name} telah di hapus oleh ${res.user?.name}.`
    );

    return res.response(RES_TYPES[200](null, `Toko ${store.name} berhasil di hapus`)).code(200);
}

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchStore
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetStores,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/user/{id}',
        handler: handlerGetStoresByUser
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateStore
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateStore
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}/update-photo',
        handler: handlerUpdateStorePhoto,
        options: {
            payload: {
                output: 'stream',
                parse: true,
                multipart: true,
                maxBytes: 3 * 1024 * 1024
            }
        }
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteStore
    },
]

module.exports = routes