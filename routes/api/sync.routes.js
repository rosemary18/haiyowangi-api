const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const db = require('../../services/db');
const { ingredientTriggers } = require('../../utils');
const abs_path = base_path + "/sync"

let syncIds = []

// Handlers

const handlerSyncSales = async (req, res) => {

    const {
        store_id,
        items
    } = req.payload || {}
    const { device_id } = req.headers || {}
    const ingredientIds = [];

    if (!store_id || !device_id || !items) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    // Synchronizing
    
    const trx = await db.transaction();

    try {


        const store = await Models.Store.findOne({ where: { id: store_id } })
        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
        const device = await Models.Device.findOne({ where: { device_id } })
        if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

        if (syncIds.includes(store_id)) return res.response(RES_TYPES[400](`Sinkronasi lain terhadap toko ${store.name} sedang berlangsung, harap mencoba beberapa saat lagi`)).code(400);
        syncIds.push(store_id)

        for (const item of items) {

            const newSale = {
                store_id,
                code: item?.code,
                payment_type_id: item?.payment_type_id,
                status: item?.status,
                total: item?.total,
                discount_id: item?.discount_id,
                staff_id: item?.staff_id,
                created_at: item?.created_at,
                updated_at: item?.updated_at
            }

            const sale = await Models.Sale.create(newSale, { transaction: trx })

            if (!sale) {
                trx.rollback();
                return res.response(RES_TYPES[400]('Gagal membuat penjualan! Sinkronisasi gagal')).code(400);
            }

            if (item.items) {
                for (const saleItem of item.items) {
                    const newSaleItem = {
                        sales_id: sale.id,
                        product_id: saleItem?.product_id,
                        variant_id: saleItem?.variant_id,
                        packet_id: saleItem?.packet_id,
                        qty: saleItem?.qty,
                        created_at: saleItem?.created_at
                    }
                    const xsaleItem = await Models.SaleItem.create(newSaleItem, { transaction: trx })
                    if (!xsaleItem) {
                        trx.rollback();
                        return res.response(RES_TYPES[400]('Gagal membuat item penjualan! Sinkronisasi gagal')).code(400);
                    }

                    // Update stock
                    
                    if (saleItem?.product_id != null) {
                        if (saleItem?.product?.ingredients?.length > 0) {
                            for (const ingredient of saleItem?.product?.ingredients) {
                                const _ingredient = await Models.Ingredient.findOne({ where: { id: ingredient?.ingredient_id } })
                                if (!_ingredient) {
                                    trx.rollback();
                                    return res.response(RES_TYPES[400]('Bahan baku tidak ditemukan! Sinkronisasi gagal')).code(400);
                                }
                                ingredientIds.push(_ingredient.id);
                                _ingredient.qty -= (ingredient?.qty*saleItem?.qty)
                                await _ingredient.save({transaction: trx})
                            }
                        } else {
                            const product = await Models.Product.findOne({ where: { id: saleItem?.product_id } })
                            if (!product) {
                                trx.rollback();
                                return res.response(RES_TYPES[400]('Produk tidak ditemukan! Sinkronisasi gagal')).code(400);
                            }
                            product.qty -= saleItem?.qty
                            await product.save({transaction: trx})
                        }
                    }

                    if (saleItem?.variant_id != null) {
                        if (saleItem?.variant?.ingredients?.length > 0) {
                            for (const ingredient of saleItem?.variant?.ingredients) {
                                const _ingredient = await Models.Ingredient.findOne({ where: { id: ingredient?.ingredient_id } })
                                if (!_ingredient) {
                                    trx.rollback();
                                    return res.response(RES_TYPES[400]('Bahan baku tidak ditemukan! Sinkronisasi gagal')).code(400);
                                }
                                ingredientIds.push(_ingredient.id);
                                _ingredient.qty -= (ingredient?.qty*saleItem?.qty)
                                await _ingredient.save({transaction: trx})
                            }
                        } else {
                            const variant = await Models.Variant.findOne({ where: { id: saleItem?.variant_id } })
                            if (!variant) {
                                trx.rollback();
                                return res.response(RES_TYPES[400]('Varian tidak ditemukan! Sinkronisasi gagal')).code(400);
                            }
                            variant.qty -= saleItem?.qty
                            await variant.save({transaction: trx})
                        }
                    }

                    if (saleItem?.packet_id != null) {
                        if (saleItem?.packet?.items?.length > 0) {
                            for (const packetItem of saleItem?.packet?.items) {
                                if (packetItem?.product_id != null) {
                                    if (packetItem?.product?.ingredients?.length > 0) {
                                        for (const ingredient of packetItem?.product?.ingredients) {
                                            const _ingredient = await Models.Ingredient.findOne({ where: { id: ingredient?.ingredient_id } })
                                            if (!_ingredient) {
                                                trx.rollback();
                                                return res.response(RES_TYPES[400]('Bahan baku tidak ditemukan! Sinkronisasi gagal')).code(400);
                                            }
                                            ingredientIds.push(_ingredient.id);
                                            _ingredient.qty -= (ingredient?.qty*packetItem?.qty)
                                            await _ingredient.save({transaction: trx})
                                        }
                                    } else {
                                        const product = await Models.Product.findOne({ where: { id: packetItem?.product_id } })
                                        if (!product) {
                                            trx.rollback();
                                            return res.response(RES_TYPES[400]('Produk tidak ditemukan! Sinkronisasi gagal')).code(400);
                                        }
                                        product.qty -= packetItem?.qty
                                        await product.save({transaction: trx})
                                    }
                                } else if (packetItem?.variant_id != null) {
                                    if (packetItem?.variant?.ingredients?.length > 0) {
                                        for (const ingredient of packetItem?.variant?.ingredients) {
                                            const _ingredient = await Models.Ingredient.findOne({ where: { id: ingredient?.ingredient_id } })
                                            if (!_ingredient) {
                                                trx.rollback();
                                                return res.response(RES_TYPES[400]('Bahan baku tidak ditemukan! Sinkronisasi gagal')).code(400);
                                            }
                                            ingredientIds.push(_ingredient.id);
                                            _ingredient.qty -= (ingredient?.qty*packetItem?.qty)
                                            await _ingredient.save({transaction: trx})
                                        }
                                    } else {
                                        const variant = await Models.Variant.findOne({ where: { id: packetItem?.variant_id } })
                                        if (!variant) {
                                            trx.rollback();
                                            return res.response(RES_TYPES[400]('Varian tidak ditemukan! Sinkronisasi gagal')).code(400);
                                        }
                                        variant.qty -= packetItem?.qty
                                        await variant.save({transaction: trx})
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (item.invoice) {

                let payment_id = null;

                if (item.invoice.payment) {

                    const newPayment = {
                        code: item?.invoice?.payment?.code,
                        account_bank: item?.invoice?.payment?.account_bank,
                        account_number: item?.invoice?.payment?.account_number,
                        receiver_account_bank: item?.invoice?.payment?.receiver_account_bank,
                        receiver_account_number: item?.invoice?.payment?.receiver_account_number,
                        img: item?.invoice?.payment?.img,
                        nominal: item?.invoice?.payment?.nominal,
                        updated_at: item?.invoice?.payment?.updated_at,
                        created_at: item?.invoice?.payment?.created_at
                    }

                    const payment = await Models.Payment.create(newPayment, {transaction: trx})
                    if (!payment) {
                        trx.rollback();
                        return res.response(RES_TYPES[400]('Gagal membuat pembayaran! Sinkronisasi gagal')).code(400);
                    }
                    payment_id = payment.id
                }

                const newInvoice = {
                    sales_id: sale.id,
                    code: item?.invoice?.code,
                    status: item?.invoice?.status,
                    discount: item?.invoice?.discount,
                    sub_total: item?.invoice?.sub_total,
                    total: item?.invoice?.total,
                    cash: item?.invoice?.cash,
                    change_money: item?.invoice?.change_money,
                    payment_id,
                    staff_id: item?.invoice?.staff_id,
                    updated_at: item?.invoice?.updated_at,
                    created_at: item?.invoice?.created_at
                }

                const invoice = await Models.Invoice.create(newInvoice, {transaction: trx})
                if (!invoice) {
                    trx.rollback();
                    return res.response(RES_TYPES[400]('Gagal membuat invoice! Sinkronisasi gagal')).code(400);
                }
            }
        }

        // Record last sync
        device.last_sync = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        store.last_sync = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        await device.save({transaction: trx})
        await store.save({transaction: trx})

         // Delete store_id from syncIds
        syncIds = syncIds.filter((id) => id != store_id)
        trx.commit();
        ingredientTriggers(ingredientIds);
        return res.response(RES_TYPES[200](null, "Sinkronasi selesai")).code(200);
    } catch (error) {

        console.log(error)
        // Delete store_id from syncIds
        syncIds = syncIds.filter((id) => id != store_id)
        trx.rollback();
        return res.response(RES_TYPES[400](`Sinkronisasi gagal: ${error}`)).code(400);
    }
}

const handlerSyncStock = async (req, res) => {

    const { store_id, incomings, outgoings } = req.payload || {}
    const { device_id } = req.headers || {}
    const ingredientIds = [];

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);
    if (!device_id) return res.response(RES_TYPES[400]('Device harus diisi!')).code(400);
    if ((incomings?.length == 0) && (outgoings?.length == 0)) return res.response(RES_TYPES[400]('Data stok harus diisi!')).code(400);

    const trx = await db.transaction();

    try {

        const store = await Models.Store.findOne({ where: { id: store_id } })
        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
        const device = await Models.Device.findOne({ where: { device_id } })
        if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

        if (incomings?.length > 0) {
            for (const incoming of incomings) {
                const newIncoming = {
                    code: incoming?.code,
                    name: incoming?.name,
                    status: 1,
                    store_id,
                    description: incoming?.description,
                }
                if (incoming?.updated_at) newIncoming.updated_at = incoming?.updated_at
                if (incoming?.created_at) newIncoming.created_at = incoming?.created_at
                const xIncoming = await Models.IncomingStock.create(newIncoming, { transaction: trx })
                if (!xIncoming) {
                    trx.rollback();
                    return res.response(RES_TYPES[400]('Gagal membuat stok masuk! Sinkronisasi gagal')).code(400);
                }

                for (const item of incoming?.incoming_stock_items) {
                    if (item?.ingredient_id != null) ingredientIds.push(item?.ingredient_id)
                    const newIncomingItem = {
                        incoming_stock_id: xIncoming?.id,
                        product_id: item?.product_id,
                        variant_id: item?.variant_id,
                        ingredient_id: item?.ingredient_id,
                        qty: item?.qty,
                    }
                    if (item?.updated_at) newIncomingItem.updated_at = item?.updated_at
                    if (item?.created_at) newIncomingItem.created_at = item?.created_at
                    const xIncomingItem = await Models.IncomingStockItem.create(newIncomingItem, { transaction: trx })
                    if (!xIncomingItem) {
                        trx.rollback();
                        return res.response(RES_TYPES[400]('Gagal membuat item stok masuk! Sinkronisasi gagal')).code(400);
                    }
                    // Post stock
                    if (item?.product_id != null) {
                        const product = await Models.Product.findOne({ where: { id: item?.product_id } })
                        if (!product) {
                            trx.rollback();
                            return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
                        }
                        product.qty += item?.qty
                        await product.save({ transaction: trx })
                    }
                    if (item?.variant_id != null) {
                        const variant = await Models.Variant.findOne({ where: { id: item?.variant_id } })
                        if (!variant) {
                            trx.rollback();
                            return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);
                        }
                        variant.qty += item?.qty
                        await variant.save({ transaction: trx })
                    }
                    if (item?.ingredient_id != null) {
                        const ingredient = await Models.Ingredient.findOne({ where: { id: item?.ingredient_id } })
                        if (!ingredient) {
                            trx.rollback();
                            return res.response(RES_TYPES[400]('Bahan baku tidak ditemukan!')).code(400);
                        }
                        ingredient.qty += item?.qty
                        await ingredient.save({ transaction: trx })
                    }
                }
            }
        }

        if (outgoings?.length > 0) {
            for (const outgoing of outgoings) {
                const newOutgoing = {
                    code: outgoing?.code,
                    name: outgoing?.name,
                    status: 1,
                    store_id,
                    description: outgoing?.description,
                }
                if (outgoing?.updated_at) newOutgoing.updated_at = outgoing?.updated_at
                if (outgoing?.created_at) newOutgoing.created_at = outgoing?.created_at
                const xOutgoing = await Models.OutgoingStock.create(newOutgoing, { transaction: trx })
                if (!xOutgoing) {
                    trx.rollback();
                    return res.response(RES_TYPES[400]('Gagal membuat stok keluar! Sinkronisasi gagal')).code(400);
                }

                for (const item of outgoing?.outgoing_stock_items) {
                    if (item?.ingredient_id != null) ingredientIds.push(item?.ingredient_id)
                    const newOutgoingItem = {
                        outgoing_stock_id: xOutgoing?.id,
                        product_id: item?.product_id,
                        variant_id: item?.variant_id,
                        ingredient_id: item?.ingredient_id,
                        qty: item?.qty,
                    }
                    if (item?.updated_at) newOutgoingItem.updated_at = item?.updated_at
                    if (item?.created_at) newOutgoingItem.created_at = item?.created_at
                    const xOutgoingItem = await Models.OutgoingStockItem.create(newOutgoingItem, { transaction: trx })
                    if (!xOutgoingItem) {
                        trx.rollback();
                        return res.response(RES_TYPES[400]('Gagal membuat item stok keluar! Sinkronisasi gagal')).code(400);
                    }
                    if (item?.product_id != null) {
                        const product = await Models.Product.findOne({ where: { id: item?.product_id } })
                        if (!product) {
                            trx.rollback();
                            return res.response(RES_TYPES[400]('Produk tidak ditemukan!')).code(400);
                        }
                        product.qty -= item?.qty
                        await product.save({ transaction: trx })
                    }
                    if (item?.variant_id != null) {
                        const variant = await Models.Variant.findOne({ where: { id: item?.variant_id } })
                        if (!variant) {
                            trx.rollback();
                            return res.response(RES_TYPES[400]('Varian tidak ditemukan!')).code(400);
                        }
                        variant.qty -= item?.qty
                        await variant.save({ transaction: trx })
                    }
                    if (item?.ingredient_id != null) {
                        const ingredient = await Models.Ingredient.findOne({ where: { id: item?.ingredient_id } })
                        if (!ingredient) {
                            trx.rollback();
                            return res.response(RES_TYPES[400]('Bahan baku tidak ditemukan!')).code(400);
                        }
                        ingredient.qty -= item?.qty
                        await ingredient.save({ transaction: trx })
                    }
                }
            }
        }

        // Record last sync
        device.last_sync = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        store.last_sync = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        await device.save({transaction: trx})
        await store.save({transaction: trx})

        // Delete store_id from syncIds
        syncIds = syncIds.filter((id) => id != store_id)
        trx.commit();
        ingredientTriggers(ingredientIds);
        return res.response(RES_TYPES[200](null, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        // Delete store_id from syncIds
        syncIds = syncIds.filter((id) => id != store_id)
        trx.rollback();
        return res.response(RES_TYPES[400](`Sinkronisasi gagal: ${error}`)).code(400);
    }

}

const handlerSync = async (req, res) => {

    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);
    if (!device_id) return res.response(RES_TYPES[400]('Device harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    const device = await Models.Device.findOne({ where: { device_id } })
    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Filtering discount
    const filter = { store_id }
    let date = new Date();
    filter[Op.and] = [
        {
            date_valid: {
                [Op.lte]: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 23:59:59`
            },
            valid_until: {
                [Op.gte]: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 00:00:01`
            },
        }
    ]

    // Synchronizing

    try {

        device.last_sync = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        store.last_sync = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        await device.save()
        await store.save()

        const staffs = await Models.Staff.findAll({ where: { store_id } })
        const discounts = await Models.Discount.findAll({ where: filter })
        const products = await Models.Product.findAll({
            where: {
                store_id,
                is_published: true
            },
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
                    ]
                },
                {
                    model: Models.Discount,
                    as: 'discounts'
                }
            ]
        })
        const variants = await Models.Variant.findAll({
            where: {
                store_id,
                is_published: true
            },
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
            ]
        })
        const packets = await Models.Packet.findAll({
            where: {
                store_id,
                is_published: true
            },
            include: [
                {
                    model: Models.PacketItem,
                    as: 'items',
                    include: [
                        {
                            model: Models.Product,
                            as: 'product',
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
                                    model: Models.Discount,
                                    as: 'discounts'
                                }
                            ]
                        },
                        {
                            model: Models.Variant,
                            as: 'variant',
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
        const sales = await Models.Sale.findAll({
            where: {
                store_id,
                created_at: {
                    [Op.gt]: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
                }
            },
            include: [
                {
                    model: Models.Invoice,
                    as: 'invoice',
                    include: [
                        {
                            model: Models.Payment,
                            as: 'payment'
                        }
                    ]
                },
                {
                    model: Models.SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Models.Product,
                            as: 'product',
                            include: [
                                {
                                    model: Models.Unit,
                                    as: 'uom'
                                },
                                {
                                    model: Models.Discount,
                                    as: 'discounts'
                                }
                            ]
                        },
                        {
                            model: Models.Variant,
                            as: 'variant',
                            include: [
                                {
                                    model: Models.Unit,
                                    as: 'uom'
                                },
                                {
                                    model: Models.Discount,
                                    as: 'discounts'
                                }
                            ]
                        },
                        {
                            model: Models.Packet,
                            as: 'packet',
                            include: [
                                {
                                    model: Models.Discount,
                                    as: 'discounts'
                                }
                            ]
                        }
                    ]
                }
            ]
        })
        const ingredients = await Models.Ingredient.findAll({
            where: { store_id },
            include: [
                {
                    model: Models.Unit,
                    as: 'uom'
                }
            ]
        })
        const paymenttypes = await Models.PaymentType.findAll()

        const data = {
            store,
            staffs,
            products,
            variants,
            packets,
            discounts,
            sales,
            ingredients,
            paymenttypes
        }
        return res.response(RES_TYPES[200](data, "Sinkronasi selesai!")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerSync,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + "/sales",
        handler: handlerSyncSales,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + "/stock",
        handler: handlerSyncStock,
        options: {
            auth: false
        }
    },
]

module.exports = routes