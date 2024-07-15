const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const { ImageUploader } = require('../../utils');
const Path = require('path');
const fs = require('fs');
const abs_path = base_path + "/product"

// Handlers

const handlerGetAllProducts = async (req, res) => {
    
    const products = await Models.Product.findAll({
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })
    return res.response(RES_TYPES[200](products)).code(200);
}

const handlerGetProduct = async (req, res) => {

    const id = req.params.id
    const product = await Models.Product.findOne({
        where: { id },
        include: [
            {
                model: Models.VariantType,
                as: 'variant_types',
                include: {
                    model: Models.VariantTypeItem,
                    as: 'variants'
                }
            },
            {
                model: Models.Unit,
                as: 'uom'
            },
            {
                model: Models.Variant,
                as: 'variants'
            }
        ]
    })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200](product)).code(200);
}

const handlerGetProductsByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

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
    
    const products = await Models.Product.findAll({
        where: filter,
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            },
            {
                model: Models.Variant,
                as: 'variants',
            }
        ],
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!products) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200](products)).code(200);
}

const handlerCreateProduct = async (req, res) => {

    const {
        name,
        description,
        qty,
        buy_price,
        price,
        is_published,
        unit_id,
        store_id
    } = req.payload || {}

    if (!name || !description || !qty || !price || !unit_id || !store_id) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newProduct = {
        name,
        description,
        qty,
        buy_price: buy_price || 0,
        price,
        is_published,
        unit_id,
        store_id
    }

    const product = await Models.Product.create(newProduct)

    if (!product) return res.response(RES_TYPES[400]('Produk gagal ditambahkan!')).code(400);

    return res.response(RES_TYPES[200](product, `Produk ${name} ditambahkan!`))
}

const handlerUpdateProduct = async (req, res) => {

    const id = req.params.id
    const {
        name,
        description,
        qty,
        buy_price,
        price,
        is_published,
        unit_id
    } = req.payload || {}

    if (!name && !description && !qty && !buy_price && !price && !is_published && !unit_id) return res.response(RES_TYPES[400]('Tidak ada data yang diupdate!')).code(400);
    
    const product = await Models.Product.findOne({
        where: { id },
        include: [
            { model: Models.Unit, as: 'uom' }
        ]
    })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);

    const store = await Models.Store.findOne({ where: { id: product.store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name) product.name = name
    if (description) product.description = description
    if (buy_price) product.buy_price = buy_price
    if (price) product.price = price
    if (is_published) product.is_published = is_published
    if (unit_id) {
        const uom = await Models.Unit.findOne({ where: { id: unit_id } })
        if (!uom) return res.response(RES_TYPES[400]('Satuan tidak ditemukan!')).code(400);
        product.unit_id = unit_id
        if ((product.uom.base_unit_symbol == uom.base_unit_symbol) && !qty) {
            let _qty = (product.qty * product.uom.conversion_factor_to_base) / uom.conversion_factor_to_base
            product.qty = _qty
        } else if (qty) product.qty = qty
    } else if (qty) product.qty = qty

    try {
        product.updated_at = new Date()
        await product.save()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400]('Produk gagal diperbarui!')).code(400);
    }

    const updated_product = await Models.Product.findOne({
        where: { id },
        include: [
            { model: Models.Unit, as: 'uom' }
        ]
    })

    return res.response(RES_TYPES[200](updated_product, `Produk ${updated_product.name} diperbarui!`))
}

const handlerUpdatePhoto = async (req, res) => {

    const id = req.params.id
    const product = await Models.Product.findOne({
        where: { id },
        include: [
            { model: Models.Store, as: 'store' }
        ]
    })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    if (product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    
    const img_name = await new Promise((resolve, reject) => {
        const uploadSingle = ImageUploader.single('file');
        uploadSingle(req.raw.req, req.raw.res, (err) => {
            if (err) reject(err);
            resolve(req.payload.file ? req.payload.file.filename : null);
        });
    });

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    if (product.img) {
        const img_name = product.img.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
    }

    product.img = req?.url?.origin + '/images/' + img_name
    
    try {
        product.updated_at = new Date()
        await product.save()
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](product, `Gambar produk ${product.name} diperbarui!`)).code(200);

}

const handlerDeleteProduct = async (req, res) => {

    const id = req.params.id
    const product = await Models.Product.findOne({ where: { id } })
    const store = await Models.Store.findOne({ where: { id: product.store_id } })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    
    const sale_items = await Models.SaleItem.findAll({ where: { product_id: id } })

    if (sale_items.length > 0) return res.response(RES_TYPES[400]('Produk yang sudah terjual tidak dapat di hapus!')).code(400);
    
    const variants = await Models.Variant.findAll({ where: { product_id: id } })
    const variant_types = await Models.VariantType.findAll({ where: { product_id: id } })

    try {

        // Delete all variant items of all variants
        if (variants.length > 0) await Models.VariantItem.destroy({ where: { variant_id: { [Op.in]: variants.map(v => v.id) } } })

        if (variant_types.length > 0) {

            // Delete variant type items of all variant types
            await Models.VariantTypeItem.destroy({ where: { variant_type_id: { [Op.in]: variant_types.map(vt => vt.id) } } })

            // Delete all variants of product
            await Models.Variant.destroy({ where: { product_id: id } })
    
            // Delete all variant types of product
            await Models.VariantType.destroy({ where: { product_id: id } })
        }

        if (product.img) {
            const img_name = product.img.split('/images/')[1]
            const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
            if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
        }

        // Delete product
        await Models.Product.destroy({ where: { id } })

    } catch (error) {
        return res.response(RES_TYPES[400](`Produk ${product.name} gagal di hapus`)).code(400);
    }

    return res.response(RES_TYPES[200](null, `Produk ${product.name} di hapus`)).code(200);
}

// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllProducts
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetProduct
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetProductsByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateProduct
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/update-photo/{id}',
        handler: handlerUpdatePhoto,
        options: {
            payload: {
                output: 'stream',
                parse: false,
                allow: 'multipart/form-data',
                maxBytes: 1 * 1024 * 1024
            }
        }
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateProduct
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteProduct
    }
]

module.exports = routes