const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const { Uploader, ingredientTriggers } = require('../../utils');
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
                    as: 'variants',
                }
            },
            {
                model: Models.IngredientItem,
                as: 'ingredients',
                include: [
                    {
                        model: Models.Ingredient,
                        as: 'ingredient',
                        include: {
                            model: Models.Unit,
                            as: 'uom'
                        }
                    },
                    {
                        model: Models.Unit,
                        as: 'uom'
                    }
                ]
            },
            {
                model: Models.Unit,
                as: 'uom'
            },
            {
                model: Models.Variant,
                as: 'variants',
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
                        model: Models.IngredientItem,
                        as: 'ingredients',
                        include: [
                            {
                                model: Models.Ingredient,
                                as: 'ingredient',
                            }
                        ]
                    }
                ]
            },
            {
                model: Models.Discount,
                as: 'discounts'
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
        per_page = 15,
        is_published
    } = req.query

    const filter = { store_id: id }
    if (search_text) {
        const searchs = search_text.split(' ');
        const ors = searchs.map(search => ({ name: { [Op.like]: `%${search}%` } }));
        filter[Op.or] = ors;
    }

    if (is_published != undefined) filter.is_published = is_published

    const totalPages = Math.ceil((await Models.Product.count({ where: filter })) / parseInt(per_page))
    const totalProducts = await Models.Product.count({ where: filter })
    
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
                include: [
                    {
                        model: Models.VariantItem,
                        as: 'variants',
                        include: {
                            model: Models.VariantTypeItem,
                            as: 'variant_type_item'
                        }
                    },
                ]
            },
            {
                model: Models.IngredientItem,
                as: 'ingredients',
                include: [
                    {
                        model: Models.Ingredient,
                        as: 'ingredient',
                        include: {
                            model: Models.Unit,
                            as: 'uom'
                        }
                    },
                    {
                        model: Models.Unit,
                        as: 'uom'
                    }
                ]
            },
            {
                model: Models.Discount,
                as: 'discounts'
            }
        ],
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!products) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200]({
        products,
        total_page: totalPages,
        current_page: parseInt(page),
        total: totalProducts
    })).code(200);
}

const handlerSearchProductByStore = async (req, res) => {

    const result = {}
    const id = req.params.id

    try {
        
        const store = await Models.Store.findOne({ where: { id } })
    
        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
        if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    
        const {
            include_packet = 1,
            include_variant = 1,
            include_ingredient = 1,
            search_text,
            order_by = 'id',
            order_type = 'DESC',
            page = 1,
            per_page = 15,
            is_published
        } = req.query
    
        const filter = { store_id: id }
        if (search_text) {
            const searchs = search_text.split(' ');
            const ors = searchs.map(search => ({ name: { [Op.like]: `%${search}%` } }));
            filter[Op.or] = ors;
        }
    
        const ingredients = await Models.Ingredient.findAll({
            where: filter,
            include: [
                {
                    model: Models.Unit,
                    as: 'uom'
                },
                {
                    model: Models.IngredientItem,
                    as: 'ingredients'
                }
            ],
        })

        if (is_published != undefined) filter.is_published = is_published    
        
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
            // offset: (parseInt(page) - 1) * parseInt(per_page),
            // limit: parseInt(per_page)
        })
    
        const variants = (include_variant != 1) ? [] : await Models.Variant.findAll({
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
            // offset: (parseInt(page) - 1) * parseInt(per_page),
            // limit: parseInt(per_page)
        })
    
        const packets = (include_packet != 1) ? [] : await Models.Packet.findAll({
            where: filter,
            include: [
                {
                    model: Models.PacketItem,
                    as: 'items',
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
            ],
            order: [[order_by, order_type]],
            // offset: (parseInt(page) - 1) * parseInt(per_page),
            // limit: parseInt(per_page)
        })
    
        if (!products) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
        
        result.products = products
        if (include_variant == 1) result.variants = variants
        if (include_packet == 1) result.packets = packets
        if (include_ingredient == 1) result.ingredients = ingredients
        return res.response(RES_TYPES[200](result)).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500](error)).code(500);
    }
}

const handlerCopyProduct = async (req, res) => {
    
    try {

        const id = req.params.id
        const { items } = req.payload
        const ingredientIds = []

        if (!items) return res.response(RES_TYPES[400]("Mohon lengkapi data!"));
        if (items?.length > 10) return  res.response(RES_TYPES[400]("Produk yang akan di salin melebihi maksimal jumlah yang diizinkan dalma satu kali penyalinan."));

        for (let i = 0; i < items?.length; i++) {

            const product = await Models.Product.findOne({
                where: { id: items[i] },
                include: [
                    {
                        model: Models.VariantType,
                        as: 'variant_types',
                        include: {
                            model: Models.VariantTypeItem,
                            as: 'variants',
                        }
                    },
                    {
                        model: Models.IngredientItem,
                        as: 'ingredients',
                        include: [
                            {
                                model: Models.Ingredient,
                                as: 'ingredient',
                            }
                        ]
                    },
                    {
                        model: Models.Variant,
                        as: 'variants',
                        include: [
                            {
                                model: Models.VariantItem,
                                as: 'variants',
                                include: {
                                    model: Models.VariantTypeItem,
                                    as: 'variant_type_item'
                                }
                            },
                            {
                                model: Models.IngredientItem,
                                as: 'ingredients',
                                include: [
                                    {
                                        model: Models.Ingredient,
                                        as: 'ingredient',
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: Models.Discount,
                        as: 'discounts'
                    },
                    {
                        model: Models.Store,
                        as: "store"
                    }
                ]
            })

            if (!product) return res.response(RES_TYPES[400](`Terdapat produk yang tidak ditemukan, penyalinan berhasil untuk ${i} produk!`))
            if (product.store?.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400](`Anda tidak memiliki akses pada salah satu produk, penyalinan berhasil untuk ${i} produk!`))

            const newProduct = {
                name: product?.name,
                img: product?.img,
                description: product?.description,
                qty: 0,
                buy_price: product?.buy_price,
                price: product?.price,
                is_published: product?.is_published,
                unit_id: product?.unit_id,
                store_id: id,
                has_variants: product?.has_variants
            }

            const x = await Models.Product.create(newProduct)

            if (!x) return res.response(RES_TYPES[400](`Salah satu produk tidak berhasil di salin, penyalinan berhasil untuk ${i} produk!`))

            const vti = {}

            if (product?.variant_types?.length > 0) {
                for (let j = 0; j < product?.variant_types.length; j++) {

                    const type = product?.variant_types[j];
                    const newType = {
                        product_id: x?.id,
                        name: type?.name
                    }

                    const nt = await Models.VariantType.create(newType);
                    if (nt) {
                        if (type?.variants?.length > 0) {
                            for (let k = 0; k < type?.variants.length; k++) {
                                const item = type?.variants[k];
                                const newItem = {
                                    name: item?.name,
                                    variant_type_id: nt?.id
                                }
                                const nti = await Models.VariantTypeItem.create(newItem)
                                if (nti) vti[item?.id] = nti?.id                                
                            }
                        }
                    }

                }
            }

            if (product?.variants?.length > 0) {
                
                for (let l = 0; l < product?.variants.length; l++) {
                    const variant = product?.variants[l];
                    const newVariant = {
                        product_id: x?.id,
                        name: variant?.name,
                        img: variant?.img,
                        description: variant?.description,
                        qty: 0,
                        buy_price: variant?.buy_price,
                        price: variant?.price,
                        is_published: variant?.is_published,
                        unit_id: variant?.unit_id,
                        store_id: id
                    }

                    const nv = await Models.Variant.create(newVariant)

                    if (nv && variant?.variants?.length > 0) {
                        for (let m = 0; m < variant?.variants.length; m++) {
                            const vi = variant?.variants[m];
                            const nvi = {
                                variant_id: nv?.id,
                                variant_type_item_id: vti[vi?.variant_type_item_id]
                            }
                            await Models.VariantItem.create(nvi);
                        }
                    }

                    if (variant?.ingredients?.length > 0) {
                        for (let n = 0; n < variant?.ingredients.length; n++) {
                            const ingredient = variant?.ingredients[n]?.ingredient;
                            const ingredientItem = variant?.ingredients[n];
        
                            let xi = await Models.Ingredient.findOne({ where: { name: ingredient?.name, store_id: id } })
        
                            if (!xi) {
        
                                const newIngredient = {
                                    store_id: id,
                                    unit_id: ingredient?.unit_id,
                                    img: ingredient?.img,
                                    name: ingredient?.name,
                                }
        
                                xi = await Models.Ingredient.create(newIngredient)
                            }
        
                            const newIngredientItem = {
                                variant_id: nv?.id,
                                ingredient_id: xi?.id,
                                unit_id: ingredientItem?.unit_id,
                                qty: ingredientItem?.qty
                            }
        
                            await Models.IngredientItem.create(newIngredientItem)
                        }
                    }
                    
                }
            }

            if (product?.ingredients?.length > 0) {
                for (let n = 0; n < product?.ingredients.length; n++) {
                    const ingredient = product?.ingredients[n]?.ingredient;
                    const ingredientItem = product?.ingredients[n];

                    let xi = await Models.Ingredient.findOne({ where: { name: ingredient?.name, store_id: id } })

                    if (!xi) {

                        const newIngredient = {
                            store_id: id,
                            unit_id: ingredient?.unit_id,
                            img: ingredient?.img,
                            name: ingredient?.name,
                        }

                        xi = await Models.Ingredient.create(newIngredient)
                    }

                    const newIngredientItem = {
                        product_id: x?.id,
                        ingredient_id: xi?.id,
                        unit_id: ingredientItem?.unit_id,
                        qty: ingredientItem?.qty
                    }

                    await Models.IngredientItem.create(newIngredientItem)
                    ingredientIds.push(xi?.id)
                }
            }
        }

        if (ingredientIds.length > 0) ingredientTriggers(ingredientIds, id)

        return res.response(RES_TYPES[200](ingredientIds, "Produk berhasil disalin!"))
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500](`Terjadi kesalahan! ${error}`)).code(500);
    }
}

const handlerCreateProduct = async (req, res) => {

    const {
        name,
        description = "",
        qty = 0,
        buy_price = 0,
        price = 0,
        is_published,
        unit_id,
        store_id
    } = req.payload || {}

    if (!name || !unit_id || !store_id) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

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
    let old_name = ""

    if (!name && !description && !qty && !buy_price && !price && (is_published == undefined) && !unit_id) return res.response(RES_TYPES[400]('Tidak ada data yang diupdate!')).code(400);
    
    const product = await Models.Product.findOne({
        where: { id },
        include: [
            { model: Models.Unit, as: 'uom' },
            { model: Models.Variant, as: 'variants' },
        ]
    })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);

    const store = await Models.Store.findOne({ where: { id: product.store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name) {
        old_name = `${product.name}`
        product.name = name
    }
    if (description) product.description = description
    if (buy_price) product.buy_price = buy_price
    if (price) product.price = price
    if (is_published != undefined) product.is_published = is_published
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
        if (is_published != undefined && is_published != 1) {
            await Promise.all(product.variants.map(async (variant) => {
                variant.is_published = 0
                await variant?.save()
            }))            
        }
        if (name && product.variants?.length > 0) {
            await Promise.all(product.variants.map(async (variant) => {
                variant.name = `${name} | ${variant.name?.replace(`${old_name} | `, "")}`
                await variant?.save()
            }))
        }
        product.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        await product.save()
    } catch (error) {
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
    
    const img_name = await Uploader(req.payload?.file)

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    if (product.img) {
        const img_name = product.img.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) fs.unlinkSync(imagesPath);
    }

    product.img = req?.url?.origin + '/images/' + img_name
    
    try {
        product.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        await product.save()
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](product, `Gambar produk ${product.name} diperbarui!`)).code(200);

}

const handlerDeleteProduct = async (req, res) => {

    const id = req.params.id
    const product = await Models.Product.findOne({ 
        where: { id },
        include: [
            {
                model: Models.IngredientItem,
                as: 'ingredients'
            }
        ]
    })
    const store = await Models.Store.findOne({ where: { id: product.store_id } })

    if (!product) return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    
    const sale_items = await Models.SaleItem.findAll({ where: { product_id: id } })

    if (sale_items.length > 0) return res.response(RES_TYPES[400]('Produk yang sudah terjual tidak dapat di hapus!')).code(400);
    
    const variants = await Models.Variant.findAll({ where: { product_id: id } })
    const variant_types = await Models.VariantType.findAll({ where: { product_id: id } })

    try {

        // Delete all ingredient items of product
        if (product.ingredients?.length > 0) await Models.IngredientItem.destroy({ where: { product_id: id } })

        // Delete all ingredient items of variants
        if (variants.length > 0) await Models.IngredientItem.destroy({ where: { variant_id: { [Op.in]: variants.map(v => v.id) } } })
        
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

        // if (product.img) {
        //     const img_name = product.img.split('/images/')[1]
        //     const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        //     if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
        // }

        // Delete product
        await Models.Product.destroy({ where: { id } })

    } catch (error) {
        console.log(error);
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
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}/search',
        handler: handlerSearchProductByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/copy/store/{id}',
        handler: handlerCopyProduct
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
                parse: true,
                multipart: true,
                maxBytes: 3 * 1024 * 1024
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