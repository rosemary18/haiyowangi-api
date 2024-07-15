const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const { ImageUploader } = require('../../utils');
const Path = require('path');
const fs = require('fs');
const abs_path = base_path + "/variant"

// Handlers

const handlerGetAllVariants = async (req, res) => {
    
    try {
        const variants = await Models.Variant.findAll({
            include: [
                {
                    model: Models.Unit,
                    as: 'uom'
                },
                {
                    model: Models.VariantItem,
                    as: 'variants',
                    include: {
                        model: Models.VariantTypeItem,
                        as: 'variant_type_item'
                    }
                },
                {
                    model: Models.Discount,
                    as: 'discounts'
                }
            ]
        })
        return res.response(RES_TYPES[200](variants)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetAllVariantTypes = async (req, res) => {
    
    const variantTypes = await Models.VariantType.findAll({
        include: [
            {
                model: Models.VariantTypeItem,
                as: 'variants'
            }
        ]
    })
    return res.response(RES_TYPES[200](variantTypes)).code(200);
}

const handlerGetAllVariantTypeItems = async (req, res) => {
    
    const variantTypeItems = await Models.VariantTypeItem.findAll()
    return res.response(RES_TYPES[200](variantTypeItems)).code(200);
}

const handlerGetVariant = async (req, res) => {

    const id = req.params.id
    const variant = await Models.Variant.findOne({
        where: { id },
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            },
            {
                model: Models.VariantItem,
                as: 'variants'
            }
        ]
    })

    if (!variant) return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](variant)).code(200);
}

const handlerGetVariantsByStore = async (req, res) => {

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

    const filter = { store_id: id, is_published: true }
    if (search_text) {
        const searchs = search_text.split(' ');
        const ors = searchs.map(search => ({ name: { [Op.like]: `%${search}%` } }));
        filter[Op.or] = ors;
    }

    const variants = await Models.Variant.findAll({
        where: filter,
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            },
            {
                model: Models.VariantItem,
                as: 'variants'
            }
        ],
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    return res.response(RES_TYPES[200](variants)).code(200);
}

const handlerGetVariantType = async (req, res) => {
    
    const id = req.params.id
    const variantType = await Models.VariantType.findOne({
        where: { id },
        include: [
            {
                model: Models.VariantTypeItem,
                as: 'variants'
            }
        ]
    })

    if (!variantType) return res.response(RES_TYPES[400]('Tipe varian tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](variantType)).code(200);
}

const handlerGetVariantByProduct = async (req, res) => {

    const id = req.params.id
    const variants = await Models.Variant.findAll({
        where: { product_id: id, is_published: true },
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            },
            {
                model: Models.VariantItem,
                as: 'variants'
            }
        ]
    })

    if (!variants) return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](variants)).code(200);
}

const handlerGetVariantTypeByProduct = async (req, res) => {

    const id = req.params.id
    const variantTypes = await Models.VariantType.findAll({
        where: { product_id: id },
        include: [
            {
                model: Models.VariantTypeItem,
                as: 'variants'
            }
        ]
    })

    if (!variantTypes) return res.response(RES_TYPES[400]('Tipe varian tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](variantTypes)).code(200);
}

const handlerCreateVariantType = async (req, res) => {

    const {
        name,
        product_id
    } = req.payload || {}

    if (!name || !product_id) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

    const product = await Models.Product.findOne({
        where: { id: product_id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    if (product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newVariantType = {
        name,
        product_id
    }

    const variantType = await Models.VariantType.create(newVariantType)

    if (!variantType) return res.response(RES_TYPES[400]('Tipe varian gagal dibuat!')).code(400);

    return res.response(RES_TYPES[200](variantType)).code(200);
}

const handlerUpdateVariantType = async (req, res) => {

    const id = req.params.id
    const { name } = req.payload || {}

    if (!name) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

    const variantType = await Models.VariantType.findOne({
        where: { id },
        include: [
            {
                model: Models.Product,
                as: 'product',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!variantType) return res.response(RES_TYPES[400]('Tipe varian tidak ditemukan!')).code(400);
    if (variantType.product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    variantType.name = name
    
    try {
        await variantType.save()
    } catch (error) {
        return res.response(RES_TYPES[400]('Tipe varian gagal diperbarui!')).code(400);
    }

    return res.response(RES_TYPES[200](variantType, `Tipe varian ${name} diperbarui!`)).code(200);
}

const handlerCreateVariantTypeItem = async (req, res) => {

    const {
        name,
        variant_type_id
    } = req.payload || {}

    if (!name || !variant_type_id) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

    const variantType = await Models.VariantType.findOne({ where: { id: variant_type_id } })

    if (!variantType) return res.response(RES_TYPES[400]('Tipe varian tidak ditemukan!')).code(400);

    const newVariantTypeItem = {
        name,
        variant_type_id
    }

    const variantTypeItem = await Models.VariantTypeItem.create(newVariantTypeItem)

    if (!variantTypeItem) return res.response(RES_TYPES[400]('Item tipe varian gagal dibuat!')).code(400);

    return res.response(RES_TYPES[200](variantTypeItem)).code(200);
}

const handlerCreateVariant = async (req, res) => {

    let {
        product_id,
        name,
        description,
        qty,
        buy_price,
        price,
        is_published,
        unit_id,
        variant_type_item
    } = req.payload || {}

    if (!product_id || !description || !qty || !price || !variant_type_item) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);
    
    const product = await Models.Product.findOne({
        where: { id: product_id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
            {
                model: Models.VariantType,
                as: 'variant_types'
            }
        ]
    })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    if (product.variant_types.length == 0) return res.response(RES_TYPES[400]('Produk harus memiliki tipe varian!')).code(400);
    if (variant_type_item.length != product.variant_types.length) return res.response(RES_TYPES[400]('Jumlah item tipe varian tidak sesuai!')).code(400);

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    if (product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    // Check if variant with variant type item exists
    const allVariantByProduct = await Models.Variant.findAll({
        where: { product_id },
        include: [
            {
                model: Models.VariantItem,
                as: 'variants'
            }
        ]
    })

    if (allVariantByProduct.length > 0) {

        const variants = []
        for (const variant of allVariantByProduct) {
            const _variants = []
            for (const item of variant.variants) _variants.push(item.variant_type_item_id)
                _variants.sort((a, b) => a - b);
            if (_variants.length > 0) variants.push(_variants)
        }
        
        if (variants.length > 0) {
            const _newVariants = variant_type_item.sort((a, b) => a - b).join('')
            for (const variant of variants) {
                if (variant.join('') == _newVariants) return res.response(RES_TYPES[400]('Varian sudah ada!')).code(400);
            }
        }
    }

    // Get all variant items
    const allVariantItem = await Models.VariantTypeItem.findAll({
        where: { id: {[Op.in]: variant_type_item } },
    })

    const name_by_variant = `${allVariantItem.length > 0 ? `${product.name} | ` : `${product.name}`}${allVariantItem.map(item => item.name).join(' | ')}`

    const newVariant = {
        product_id,
        store_id: product.store_id,
        name: name || name_by_variant,
        description,
        qty,
        buy_price: buy_price || 0,
        price,
        is_published: is_published || true,
        unit_id: unit_id || product.unit_id
    }

    const variant = await Models.Variant.create(newVariant)

    if (!variant) return res.response(RES_TYPES[400]('Varian gagal ditambahkan!')).code(400);

    product.has_variants = true
    product.updated_at = new Date()
    await product.save()

    // Create Variant Items
    variant_type_item.forEach(async (item) => {
        const newVariantItem = {
            variant_id: variant.id,
            variant_type_item_id: item
        }
        await Models.VariantItem.create(newVariantItem)
    })

    return res.response(RES_TYPES[200](variant, `Varian ${variant.name} ditambahkan!`))
}

const handlerUpdateVariant = async (req, res) => {

    const {
        name,
        description,
        buy_price,
        price,
        qty,
        is_published,
        unit_id,
    } = req.payload || {}

    if (!name && !description && !buy_price && !qty && !price && is_published == undefined && !unit_id) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

    const id = req.params.id
    const variant = await Models.Variant.findOne({
        where: { id },
        include: [
            {
                model: Models.Product,
                as: 'product',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            },
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })

    if (!variant) return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);
    if (variant.product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name) variant.name = name
    if (description) variant.description = description
    if (buy_price) variant.buy_price = buy_price
    if (price) variant.price = price
    if (is_published != undefined) variant.is_published = is_published
    if (unit_id) {
        const uom = await Models.Unit.findOne({ where: { id: unit_id } })
        if (!uom) return res.response(RES_TYPES[400]('Satuan tidak ditemukan!')).code(400);
        variant.unit_id = unit_id
        if ((variant.uom.base_unit_symbol == uom.base_unit_symbol) && !qty) {
            let _qty = (variant.qty * variant.uom.conversion_factor_to_base) / uom.conversion_factor_to_base
            variant.qty = _qty
        } else if (qty) variant.qty = qty
    } else if (qty) variant.qty = qty

    variant.updated_at = new Date()
    
    try {
        await variant.save()
    } catch (error) {
        return res.response(RES_TYPES[400]('Varian gagal diperbarui!')).code(400);
    }

    const updatedVariant = await Models.Variant.findOne({
        where: { id },
        include: [
            {
                model: Models.Product,
                as: 'product',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            },
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })

    return res.response(RES_TYPES[200](updatedVariant, `Varian ${updatedVariant.name} diperbarui!`))
}

const handlerUpdatePhotoVariant = async (req, res) => {

    const id = req.params.id
    const variant = await Models.Variant.findOne({
        where: { id },
        include: [
            {
                model: Models.Product,
                as: 'product',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!variant) return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);
    if (variant.product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    
    const img_name = await new Promise((resolve, reject) => {
        const uploadSingle = ImageUploader.single('file');
        uploadSingle(req.raw.req, req.raw.res, (err) => {
            if (err) reject(err);
            resolve(req.payload.file ? req.payload.file.filename : null);
        });
    });

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    if (variant.img) {
        const img_name = variant.img.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
    }

    variant.img = req?.url?.origin + '/images/' + img_name
    
    try {
        variant.updated_at = new Date()
        await variant.save()
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](variant, `Gambar produk ${variant.name} diperbarui!`)).code(200);
}

const handlerDeleteVariant = async (req, res) => {

    const id = req.params.id
    const variant = await Models.Variant.findOne({
        where: { id },
        include: [
            {
                model: Models.VariantItem,
                as: 'variants'
            },
            {
                model: Models.Product,
                as: 'product',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!variant) return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);
    if (variant.product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        
        await Models.VariantItem.destroy({ where: { variant_id: variant.id } })
        await Models.Variant.destroy({ where: { id } })
        const product = await Models.Product.findOne({
            where: { id: variant.product_id },
            include: [
                {
                    model: Models.Variant,
                    as: 'variants'
                }
            ]
        })

        if (product.variants.length == 0) {
            product.has_variants = false
            await product.save()
        }

    } catch (error) {
        return res.response(RES_TYPES[400]('Varian gagal di hapus!')).code(400);
    }

    return res.response(RES_TYPES[200](null, `Varian ${variant.name} di hapus!`)).code(200);
}

const handlerDeleteVariantTypeItem = async (req, res) => {

    const id = req.params.id
    const variantTypeItem = await Models.VariantTypeItem.findOne({ where: { id } })

    if (!variantTypeItem) return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);

    const existVariantItems = await Models.VariantItem.findAll({
        where: { variant_type_item_id: id },
        include: [
            {
                model: Models.VariantTypeItem,
                as: 'variant_type_item'
            }
        ]
    })

    try {

        if (existVariantItems.length > 0) {
            for (const item of existVariantItems) {
                const variant = await Models.Variant.findOne({
                    where: { id: item.variant_id },
                    include: [
                        {
                            model: Models.VariantItem,
                            as: 'variants'
                        }
                    ]
                })
                if (variant && variant.variants.length > 1) {
                    let newName = variant.name.split(' | ').filter(it => it != item.variant_type_item.name);
                    console.log(newName)
                    variant.name = newName.join(' | ')
                    variant.updated_at = new Date()
                    await variant.save()
                }
                await Models.VariantItem.destroy({ where: { id: item.id } })
                if (variant && variant.variants.length == 0) await variant.destroy()
            }
        }

        await Models.VariantTypeItem.destroy({ where: { id } })
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400]('Varian gagal di hapus!')).code(400);
    }

    return res.response(RES_TYPES[200](null, `Varian ${variantTypeItem.name} di hapus!`)).code(200);
}

const handlerDeleteVariantType = async (req, res) => {

    const id = req.params.id
    const variantType = await Models.VariantType.findOne({
        where: { id },
        include: [
            {
                model: Models.VariantTypeItem,
                as: 'variants'
            },
            {
                model: Models.Product,
                as: 'product',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!variantType) return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);
    if (variantType.product.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {

        if (variantType.variants.length > 0) {
            for (const item of variantType.variants) {
                const existVariantItems = await Models.VariantItem.findAll({where: { variant_type_item_id: item.id }})
                if (existVariantItems.length > 0) {
                    for (const _item of existVariantItems) {
                        const variant = await Models.Variant.findOne({
                            where: { id: _item.variant_id },
                            include: [
                                {
                                    model: Models.VariantItem,
                                    as: 'variants'
                                }
                            ]
                        })
                        if (variant && variant.variants.length > 1) {
                            let newName = variant.name.split(' | ').filter(it => it != item.name);
                            variant.name = newName.join(' | ')
                            variant.updated_at = new Date()
                            await variant.save()
                        }
                        await Models.VariantItem.destroy({ where: { id: _item.id } })
                        if (variant && variant.variants.length == 0) await variant.destroy()
                    }
                }
                await Models.VariantTypeItem.destroy({ where: { id: item.id } })
            }
        
        }
    
        await Models.VariantType.destroy({ where: { id } })
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400]('Varian gagal di hapus!')).code(400);
    }

    return res.response(RES_TYPES[200](null, `Varian ${variantType.name} di hapus!`)).code(200);
}

// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllVariants
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/type',
        handler: handlerGetAllVariantTypes
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/type/item',
        handler: handlerGetAllVariantTypeItems
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetVariant
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetVariantsByStore
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/type/{id}',
        handler: handlerGetVariantType
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/product/{id}',
        handler: handlerGetVariantByProduct
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/type/product/{id}',
        handler: handlerGetVariantTypeByProduct
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateVariant
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateVariant
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/type',
        handler: handlerCreateVariantType
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/type/{id}',
        handler: handlerUpdateVariantType
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/type/item',
        handler: handlerCreateVariantTypeItem
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/update-photo/{id}',
        handler: handlerUpdatePhotoVariant,
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
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteVariant
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/type/item/{id}',
        handler: handlerDeleteVariantTypeItem
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/type/{id}',
        handler: handlerDeleteVariantType
    }
]

module.exports = routes