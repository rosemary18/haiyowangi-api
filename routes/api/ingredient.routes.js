const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { ImageUploader } = require('../../utils');
const Path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const abs_path = base_path + "/ingredient"

// Handlers

const handlerGetAllIngredients = async (req, res) => {

    try {
        const ingredients = await Models.Ingredient.findAll({
            include: [
                {
                    model: Models.Unit,
                    as: 'uom'
                }
            ]
        })
        return res.response(RES_TYPES[200](ingredients)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }
}

const handlerGetIngredient = async (req, res) => {

    const id = req.params.id
    const ingredient = await Models.Ingredient.findOne({
        where: { id },
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })

    if (!ingredient) return res.response(RES_TYPES[404]("Bahan baku tidak ditemukan!")).code(404);

    return res.response(RES_TYPES[200](ingredient)).code(200);
}

const handlerGetIngredientsByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({where: { id }})
    
    if (!store) return res.response(RES_TYPES[404]("Toko tidak ditemukan!")).code(404);
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
    
    const ingredients = await Models.Ingredient.findAll({
        where: filter,
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            }
        ],
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!ingredients) return res.response(RES_TYPES[404]("Bahan baku tidak ditemukan!")).code(404);
    
    return res.response(RES_TYPES[200](ingredients)).code(200);
}

const handlerGetAllIngredientItems = async (req, res) => {

    try {
        const ingredient_items = await Models.IngredientItem.findAll({
            include: [
                {
                    model: Models.Ingredient,
                    as: 'ingredient'
                },
                {
                    model: Models.Unit,
                    as: 'uom'
                }
            ]
        })
        return res.response(RES_TYPES[200](ingredient_items)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error)).code(500);
    }
}

const handlerGetIngredientItem = async (req, res) => {

    const id = req.params.id
    const ingredient_item = await Models.IngredientItem.findOne({
        where: { id },
        include: [
            {
                model: Models.Ingredient,
                as: 'ingredient'
            },
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })

    if (!ingredient_item) return res.response(RES_TYPES[404]("Item bahan baku tidak ditemukan!")).code(404);

    return res.response(RES_TYPES[200](ingredient_item)).code(200);
}

const handlerGetIngredientItemsByProduct = async (req, res) => {

    const id = req.params.id
    const product = await Models.Product.findOne({where: { id }})

    if (!product) return res.response(RES_TYPES[404]("Produk tidak ditemukan!")).code(404);

    const ingredient_items = await Models.IngredientItem.findAll({
        where: { product_id: id },
        include: [
            {
                model: Models.Ingredient,
                as: 'ingredient'
            },
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })

    if (!ingredient_items) return res.response(RES_TYPES[404]("Item bahan baku tidak ditemukan!")).code(404);

    return res.response(RES_TYPES[200](ingredient_items)).code(200);
}

const handlerGetIngredientItemsByVariant = async (req, res) => {

    const id = req.params.id
    const variant = await Models.Variant.findOne({where: { id }})

    if (!variant) return res.response(RES_TYPES[404]("Varian tidak ditemukan!")).code(404);

    const ingredient_items = await Models.IngredientItem.findAll({
        where: { variant_id: id },
        include: [
            {
                model: Models.Ingredient,
                as: 'ingredient'
            },
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })

    if (!ingredient_items) return res.response(RES_TYPES[404]("Item bahan baku tidak ditemukan!")).code(404);

    return res.response(RES_TYPES[200](ingredient_items)).code(200);
}

const handlerCreateIngredient = async (req, res) => {

    const { name, qty, unit_id, store_id } = req.payload || {}

    if (!name || !qty || !unit_id || !store_id) return res.response(RES_TYPES[400]('Mohon lengkapi semua data!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[404]("Toko tidak ditemukan!")).code(404);
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const ingredient = await Models.Ingredient.create({ name, qty, unit_id, store_id })

    if (!ingredient) return res.response(RES_TYPES[500]("Gagal membuat bahan baku!")).code(500);

    return res.response(RES_TYPES[200](ingredient, `Bahan baku ${name} berhasil dibuat.`)).code(200);
}

const handlerUpdatePhotoIngredient = async (req, res) => {

    const id = req.params.id
    const ingredient = await Models.Ingredient.findOne({
        where: { id },
        include: [
            { model: Models.Store, as: 'store' },
            { model: Models.Unit, as: 'uom' },
        ]
    })

    if (!ingredient) return res.response(RES_TYPES[404]("Bahan baku tidak ditemukan!")).code(404);
    if (ingredient.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    
    const img_name = await new Promise((resolve, reject) => {
        const uploadSingle = ImageUploader.single('file');
        uploadSingle(req.raw.req, req.raw.res, (err) => {
            if (err) reject(err);
            resolve(req.payload.file ? req.payload.file.filename : null);
        });
    });

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    if (ingredient.img) {
        const img_name = ingredient.img.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
    }

    ingredient.img = req?.url?.origin + '/images/' + img_name
    
    try {
        ingredient.updated_at = new Date()
        await ingredient.save()
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](ingredient, `Gambar bahan baku ${ingredient.name} diperbarui!`)).code(200);
}


const handlerUpdateIngredient = async (req, res) => {

    const id = req.params.id
    const { name, qty, unit_id } = req.payload || {}

    if (!name && !qty && !unit_id) return res.response(RES_TYPES[400]('Tidak ada data yang diubah!')).code(400);

    const ingredient = await Models.Ingredient.findOne({
        where: { id },
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            },
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!ingredient) return res.response(RES_TYPES[404]("Bahan baku tidak ditemukan!")).code(404);
    if (req.auth.credentials?.user?.id != ingredient?.store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        if (name) ingredient.name = name
        if (unit_id) {
            const uom = await Models.Unit.findOne({ where: { id: unit_id } })
            if (!uom) return res.response(RES_TYPES[400]('Satuan tidak ditemukan!')).code(400);
            ingredient.unit_id = unit_id
            if ((ingredient.uom.base_unit_symbol == uom.base_unit_symbol) && !qty) {
                let _qty = (ingredient.qty * ingredient.uom.conversion_factor_to_base) / uom.conversion_factor_to_base
                ingredient.qty = _qty
            } else if (qty) ingredient.qty = qty
        } else if (qty) ingredient.qty = qty
        await ingredient.save()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500]("Gagal mengubah bahan baku!")).code(500);
    }

    const updatedIngredient = await Models.Ingredient.findOne({
        where: { id },
        include: [
            {
                model: Models.Unit,
                as: 'uom'
            }
        ]
    })
    
    return res.response(RES_TYPES[200](updatedIngredient, `Bahan baku ${updatedIngredient.name} berhasil diubah.`)).code(200);
}

const handlerCreateIngredientItem = async (req, res) => {
    
    const { items } = req.payload || {}
    
    // Items
    // product_id, variant_id, ingredient_id, qty, unit_id
    
    if (!items || items.length == 0) return res.response(RES_TYPES[400]('Mohon lengkapi data!')).code(400);

    const product = await Models.Product.findOne({
        where: { id: items[0].product_id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!product) return res.response(RES_TYPES[404]("Produk tidak ditemukan!")).code(404);
    if (req.auth.credentials?.user?.id != product?.store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        for (let i = 0; i < items.length; i++) {            
            const newItem = {}
            if (items[i]?.product_id) newItem.product_id = items[i]?.product_id
            if (items[i]?.variant_id) newItem.variant_id = items[i]?.variant_id
            if (items[i]?.ingredient_id) newItem.ingredient_id = items[i]?.ingredient_id
            if (items[i]?.qty) newItem.qty = items[i]?.qty
            if (items[i]?.unit_id) newItem.unit_id = items[i]?.unit_id
            console.log(newItem)
            await Models.IngredientItem.create(newItem)
        }
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500]("Gagal membuat item bahan baku!")).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item bahan baku berhasil dibuat.`)).code(200);
}

const handlerUpdateIngredientItem = async (req, res) => {
    
    const id = req.params.id
    const { qty } = req.payload || {}

    if (!qty) return res.response(RES_TYPES[400]('Tidak ada data yang diubah!')).code(400);

    const item = await Models.IngredientItem.findOne({
        where: { id },
        include: [
            {
                model: Models.Ingredient,
                as: 'ingredient'
            }
        ]
    })

    if (!item) return res.response(RES_TYPES[404]("Item bahan baku tidak ditemukan!")).code(404);

    try {
        item.qty = qty
        await item.save()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500]("Gagal mengubah item bahan baku!")).code(500);
    }

    return res.response(RES_TYPES[200](null, `Item bahan baku ${item.ingredient.name} berhasil diubah.`)).code(200);
}

const handlerDeleteIngredient = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })
    
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    
    const ingredient = await Models.Ingredient.findOne({ where: { id } })

    if (!ingredient) return res.response(RES_TYPES[404]("Bahan baku tidak ditemukan!")).code(404);

    try {
        await Models.IngredientItem.destroy({ where: { ingredient_id: id } })
        await ingredient.destroy()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500]("Gagal menghapus bahan baku!")).code(500);
    }
    
    return res.response(RES_TYPES[200](null, `Bahan baku ${ingredient.name} berhasil dihapus.`)).code(200);
}

const handlerDeleteIngredientItem = async (req, res) => {

    const id = req.params.id
    const IngredientItem = await Models.IngredientItem.findOne({
        where: { id },
        include: [
            {
                model: Models.Ingredient,
                as: 'ingredient',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!IngredientItem) return res.response(RES_TYPES[404]("Item bahan baku tidak ditemukan!")).code(404);
    if (req.auth.credentials?.user?.id != IngredientItem?.ingredient?.store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        await IngredientItem.destroy()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500]("Gagal menghapus item bahan baku!")).code(500);
    }
    
    return res.response(RES_TYPES[200](null, `Item bahan baku ${IngredientItem.ingredient.name} berhasil dihapus.`)).code(200);
}

// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllIngredients
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/{id}",
        handler: handlerGetIngredient
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/store/{id}",
        handler: handlerGetIngredientsByStore
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/item",
        handler: handlerGetAllIngredientItems
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/item/{id}",
        handler: handlerGetIngredientItem
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/item/product/{id}",
        handler: handlerGetIngredientItemsByProduct
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/item/variant/{id}",
        handler: handlerGetIngredientItemsByVariant
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateIngredient
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + "/item",
        handler: handlerCreateIngredientItem
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + "/item/{id}",
        handler: handlerUpdateIngredientItem
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + "/update-photo/{id}",
        handler: handlerUpdatePhotoIngredient,
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
        path: abs_path + "/{id}",
        handler: handlerUpdateIngredient
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + "/{id}",
        handler: handlerDeleteIngredient
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + "/item/{id}",
        handler: handlerDeleteIngredientItem
    }
]

module.exports = routes