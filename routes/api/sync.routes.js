const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/sync"

let syncIds = []

// Handlers

const handlerSyncStoreSales = async (req, res) => {

    const {
        store_id,
        device_id,
        items
    } = req.payload || {}

    if (!store_id || !device_id || !items) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    const device = await Models.Device.findOne({ where: { device_id } })
    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    if (syncIds.includes(store_id)) return res.response(RES_TYPES[400](`Sinkronasi lain terhadap toko ${store.name} sedang berlangsung, harap mencoba beberapa saat lagi`)).code(400);
    syncIds.push(store_id)

    // Synchronizing

    try {

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

            await Models.Sale.create(newSale)

            if (!newSale) return res.response(RES_TYPES[400]('Gagal membuat penjualan! Sinkronisasi gagal')).code(400);

            if (item.items) {
                for (const saleItem of item.items) {
                    const newSaleItem = {
                        sales_id: newSale.id,
                        product_id: saleItem?.product_id,
                        variant_id: saleItem?.variant_id,
                        packet_id: saleItem?.packet_id,
                        qty: saleItem?.qty,
                        created_at: saleItem?.created_at
                    }
                    await Models.SaleItem.create(newSaleItem)
                    if (!newSaleItem) return res.response(RES_TYPES[400]('Gagal membuat item penjualan! Sinkronisasi gagal')).code(400);
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

                    await Models.Payment.create(newPayment)
                    if (!newPayment) return res.response(RES_TYPES[400]('Gagal membuat payment! Sinkronisasi gagal')).code(400);
                    payment_id = newPayment.id
                }

                const newInvoice = {
                    sales_id: newSale.id,
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

                await Models.Invoice.create(newInvoice)
                if (!newInvoice) return res.response(RES_TYPES[400]('Gagal membuat invoice! Sinkronisasi gagal')).code(400);
            }
        }

        // Record last sync
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()

         // Delete store_id from syncIds
        syncIds = syncIds.filter((id) => id != store_id)
        return res.response(RES_TYPES[200](null, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](`Sinkronisasi gagal: ${error}`)).code(400);
    }
}

const handlerSyncProduct = async (req, res) => {

    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}
    
    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);
    if (!device_id) return res.response(RES_TYPES[400]('Device harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const device = await Models.Device.findOne({ where: { device_id } })

    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Synchronizing

    try {
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()
        const products = await Models.Product.findAll({
            where: {
                store_id,
                is_published: true
            },
            include: [
                {
                    model: Models.VariantType,
                    as: 'variant_types',
                    include: [
                        {
                            model: Models.VariantTypeItem,
                            as: 'variants'
                        }
                    ]
                }
            ]
        })
        return res.response(RES_TYPES[200](products, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerSyncVariants = async (req, res) => {

    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const device = await Models.Device.findOne({ where: { device_id } })

    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Synchronizing

    try {
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()
        const variants = await Models.Variant.findAll({
            where: {
                store_id,
                is_published: true
            },
            include: [
                {
                    model: Models.VariantItem,
                    as: 'variants'
                }
            ]
        })
        return res.response(RES_TYPES[200](variants, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerSyncIngredients = async (req, res) => {
    
    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const device = await Models.Device.findOne({ where: { device_id } })

    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Synchronizing

    try {
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()
        const ingredients = await Models.Ingredient.findAll({
            where: { store_id },
            include: [
                {
                    model: Models.IngredientItem,
                    as: 'ingredients'
                }
            ]
        })
        return res.response(RES_TYPES[200](ingredients, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerSyncSales = async (req, res) => {

    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const device = await Models.Device.findOne({ where: { device_id } })

    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Synchronizing

    try {
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()
        const sales = await Models.Sale.findAll({
            where: {
                store_id,
                created_at: {
                    [Op.gt]: new Date(new Date().setDate(new Date().getDate() - 14))
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
            ]
        })
        return res.response(RES_TYPES[200](sales, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerSyncDiscounts = async (req, res) => {

    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const device = await Models.Device.findOne({ where: { device_id } })

    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Synchronizing

    try {
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()
        const discounts = await Models.Discount.findAll({ where: { store_id } })
        return res.response(RES_TYPES[200](discounts, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerSyncPackets = async (req, res) => {

    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const device = await Models.Device.findOne({ where: { device_id } })

    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Synchronizing

    try {
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()
        const packets = await Models.Packet.findAll({
            where: {
                store_id,
                is_published: true
            },
            include: [
                {
                    model: Models.PacketItem,
                    as: 'items'
                }
            ]
        })
        return res.response(RES_TYPES[200](packets, "Sinkronasi selesai")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerSyncStaffs = async (req, res) => {

    const { store_id } = req.payload || {}
    const { device_id } = req.headers || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    const device = await Models.Device.findOne({ where: { device_id } })

    if (!device) return res.response(RES_TYPES[400]('Device tidak ditemukan!')).code(400);

    // Synchronizing

    try {
        device.last_sync = new Date()
        store.last_sync = new Date()
        await device.save()
        await store.save()
        const staffs = await Models.Staff.findAll({ where: { store_id } })
        return res.response(RES_TYPES[200](staffs, "Sinkronasi selesai")).code(200);
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
        handler: handlerSyncStoreSales,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/product',
        handler: handlerSyncProduct,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/variant',
        handler: handlerSyncVariants,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/ingredient',
        handler: handlerSyncIngredients,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/sales',
        handler: handlerSyncSales,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/discount',
        handler: handlerSyncDiscounts,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/packet',
        handler: handlerSyncPackets,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/staff',
        handler: handlerSyncStaffs,
        options: {
            auth: false
        }
    },
]

module.exports = routes