const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { ImageUploader } = require('../../utils');
const { Op } = require('sequelize');
const abs_path = base_path + "/sales"

// Handlers

const handlerSearchSales = async (req, res) => {

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

        const sales = await Models.Sale.findAll({
            where: {
                store_id,
                [Op.or]: [
                    { code: { [Op.like]: `%${search_text}%` } },
                ]
            },
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](sales)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetAllSales = async (req, res) => {

    try {
        const sales = await Models.Sale.findAll()
        return res.response(RES_TYPES[200](sales)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetSale = async (req, res) => {

    try {
        const id = req.params.id
        const sale = await Models.Sale.findOne({
            where: { id },
            include: [
                {
                    model: Models.SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Models.Product,
                            as: 'product',
                            include: {
                                model: Models.Discount,
                                as: 'discounts',
                                where: {
                                    valid_until: { [Op.gte]: new Date() },
                                    date_valid: { [Op.lte]: new Date() }
                                }
                            },
                        },
                        {
                            model: Models.Variant,
                            as: 'variant',
                            include: {
                                model: Models.Discount,
                                as: 'discounts',
                                where: {
                                    valid_until: { [Op.gte]: new Date() },
                                    date_valid: { [Op.lte]: new Date() }
                                }
                            },
                        },
                        {
                            model: Models.Packet,
                            as: 'packet',
                            include: {
                                model: Models.Discount,
                                as: 'discounts',
                                where: {
                                    valid_until: { [Op.gte]: new Date() },
                                    date_valid: { [Op.lte]: new Date() }
                                }
                            },
                        }
                    ],
                },
                {
                    model: Models.Invoice,
                    as: 'invoice'
                },
                {
                    model: Models.Discount,
                    as: 'discount'
                },
                {
                    model: Models.PaymentType,
                    as: 'payment_type'
                },
                {
                    model: Models.Store,
                    as: 'store'
                },
                {
                    model: Models.Staff,
                    as: 'staff'
                }
            ]
        })

        if (!sale) return res.response(RES_TYPES[400]('Penjualan tidak ditemukan!')).code(400);
        if (sale.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

        return res.response(RES_TYPES[200](sale)).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetSaleByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const {
        search_text,
        status,
        order_by = 'id',
        order_type = 'DESC',
        page = 1,
        per_page = 15
    } = req.query

    const filter = { store_id: id }
    if (status != undefined) filter.status = status
    if (search_text) {
        filter[Op.or] = [
            { code: { [Op.like]: `%${search_text}%` } },
        ]
    }

    const sales = await Models.Sale.findAll({
        where: filter,
        order: [[order_by, order_type]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!sales) return res.response(RES_TYPES[400]('Penjualan tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](sales)).code(200);
}

const handlerCreateSale = async (req, res) => {

    const { store_id } = req.payload || {}

    if (!store_id) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newSale = {
        code: `SO${Date.now()}`,
        store_id,        
    }

    const sale = await Models.Sale.create(newSale)

    if (!sale) return res.response(RES_TYPES[400]('Gagal membuat penjualan!')).code(400);

    return res.response(RES_TYPES[200](sale, `Penjualan baru telah dibuat!`)).code(200);
}

const handlerUpdateSale = async (req, res) => {

    const id = req.params.id
    const { 
        items,
        deleteItems,
        discount_id,
        status,
        payment_type_id
    } = req.payload || {}

    if (!items && !deleteItems && !discount_id && !status && !payment_type_id) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    // Items: [{ product_id || variant_id || packet_id, qty }]

    const sale = await Models.Sale.findOne({
        where: { id },
        include: [
            {
                model: Models.SaleItem,
                as: 'items'
            },
            {
                model: Models.Discount,
                as: 'discount'
            },
            {
                model: Models.Store,
                as: 'store'
            },
        ]
    })

    if (!sale) return res.response(RES_TYPES[400]('Penjualan tidak ditemukan!')).code(400);
    if (sale.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (sale.status >= 2) return res.response(RES_TYPES[400](`Penjualan ${sale.code} tidak dapat di ubah!`)).code(400);

    try {
        
        if (status) {
            if (sale.status > 0) return res.response(RES_TYPES[400](`Penjualan ini tidak dapat di ubah kembali!`)).code(400);
            if (status > 2) return res.response(RES_TYPES[400](`Status penjualan tidak valid!`)).code(400);
            if (status > 0 && (sale.items?.length == 0 && !items)) return res.response(RES_TYPES[400](`Jika ingin mengubah status penjualan maka penjualan harus memiliki minimal 1 item!`)).code(400);
            if (status == 1) return res.response(RES_TYPES[400](`Anda harus menyelesaikan pembayaran!`)).code(400);
            sale.status = status
        }

        if (payment_type_id) {
            const payment_type = await Models.PaymentType.findOne({ where: { id: payment_type_id } })
            if (!payment_type) return res.response(RES_TYPES[400](`Metode pembayaran tidak ditemukan!`)).code(400);
            sale.payment_type_id = payment_type_id
        }

        if (items) {
            for (const item of items) {

                if (!item.product_id && !item.variant_id && !item.packet_id) return res.response(RES_TYPES[400](`Data item tidak valid!`)).code(400);
                if (!item.qty) return res.response(RES_TYPES[400](`Jumlah qty item dalam data item harus diisi!`)).code(400);

                // Check available quantity of product
                if (item.product_id) {
                    const product = await Models.Product.findOne({ where: { id: item.product_id } })
                    if (!product) return res.response(RES_TYPES[400](`Produk tidak ditemukan!`)).code(400);
                    if (product.qty < item.qty) return res.response(RES_TYPES[400](`Jumlah item product ${product.name} yang tersedia tidak mencukupi!`)).code(400);
                }

                // Check available quantity of variant
                if (item.variant_id) {
                    const variant = await Models.Variant.findOne({ where: { id: item.variant_id } })
                    if (!variant) return res.response(RES_TYPES[400](`Varian tidak ditemukan!`)).code(400);
                    if (variant.qty < item.qty) return res.response(RES_TYPES[400](`Jumlah item varian ${variant.name} yang tersedia tidak mencukupi!`)).code(400);
                }

                // Check available quantity of packet
                if (item.packet_id) {
                    const packet = await Models.Packet.findOne({
                        where: { id: item.packet_id },
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
                        ]
                    })
                    if (!packet) return res.response(RES_TYPES[400](`Paket tidak ditemukan!`)).code(400);
                    if (packet.items?.length > 0) {
                        for (const _item of packet.items) {
                            if (_item.product && (_item.product.qty < item.qty)) {
                                return res.response(RES_TYPES[400](`Jumlah item product ${_item.product.name} pada packet ${packet.name} yang tersedia tidak mencukupi!`)).code(400);
                            }
                            if (_item.variant && (_item.variant.qty < item.qty)) {
                                return res.response(RES_TYPES[400](`Jumlah item varian ${_item.variant.name} pada packet ${packet.name} yang tersedia tidak mencukupi!`)).code(400);
                            }
                        }
                    }
                }

                let existItem = null
                if (sale.items.length > 0) {
                    for (const _item of sale.items) {
                        if (_item.product_id && (_item.product_id == item.product_id)) existItem = _item
                        if (_item.variant_id && (_item.variant_id == item.variant_id)) existItem = _item
                        if (_item.packet_id && (_item.packet_id == item.packet_id)) existItem = _item
                    }
                }

                if (existItem != null) await Models.SaleItem.update({ qty: item?.qty }, { where: { id: existItem.id } })
                else {

                    const newSaleItem = { sales_id: sale.id}

                    if (item?.qty > 1) newSaleItem.qty = item?.qty
                    if (item?.product_id) newSaleItem.product_id = item?.product_id
                    if (item?.variant_id) newSaleItem.variant_id = item?.variant_id
                    if (item?.packet_id) newSaleItem.packet_id = item?.packet_id

                    await Models.SaleItem.create(newSaleItem);
                }
            }
        }

        if (deleteItems) {
            for (const item_id of deleteItems) {
                await Models.SaleItem.destroy({ where: { id: item_id } })
            }
        }

        if (discount_id) {
            const discount = await Models.Discount.findOne({ where: { id: discount_id } })
            let allQty = 0
            if (items) for (const item of items) allQty += item.qty
            if (sale.items?.length > 0) for (const item of sale.items) allQty += item.qty
            if (!discount) return res.response(RES_TYPES[400](`Diskon tidak ditemukan!`)).code(400);
            if ((new Date(discount.date_valid)) > Date.now()) return res.response(RES_TYPES[400](`Diskon belum berlaku!`)).code(400);
            if ((new Date(discount.valid_until)) < Date.now()) return res.response(RES_TYPES[400](`Diskon sudah tidak berlaku!`)).code(400);
            if (discount.max_items_qty > 0) {
                if (allQty > discount.max_items_qty) return res.response(RES_TYPES[400](`Diskon tidak dapat ditambahkan, karena maksimal qty diskon adalah ${discount.max_items_qty}!`)).code(400);
            }
            if (discount.min_items_qty > 0) {
                if (allQty < discount.min_items_qty) return res.response(RES_TYPES[400](`Diskon tidak dapat ditambahkan, karena minimal qty diskon adalah ${discount.min_items_qty}!`)).code(400);
            }
            if (discount.special_for_product_id || discount.special_for_variant_id || discount.special_for_packet_id) {
                return res.response(RES_TYPES[400](`Diskon tidak dapat ditambahkan, karena diskon hanya berlaku untuk produk, variant atau paket tertentu. Untuk diskon pada produk, variant atau paket tertentu akan ditambahkan secara otomatis!`)).code(400);
            }
            sale.discount_id = discount_id
        }
        
        await sale.save();

        const updatedSale = await Models.Sale.findOne({
            where: { id },
            include: [
                {
                    model: Models.SaleItem,
                    as: 'items',
                    include: [
                        {
                            model: Models.Product,
                            as: 'product',
                            include: {
                                model: Models.Discount,
                                as: 'discounts',
                                where: {
                                    valid_until: { [Op.gte]: new Date() },
                                    date_valid: { [Op.lte]: new Date() }
                                }
                            },
                        },
                        {
                            model: Models.Variant,
                            as: 'variant',
                            include: {
                                model: Models.Discount,
                                as: 'discounts',
                                where: {
                                    valid_until: { [Op.gte]: new Date() },
                                    date_valid: { [Op.lte]: new Date() }
                                }
                            },
                        },
                        {
                            model: Models.Packet,
                            as: 'packet',
                            include: {
                                model: Models.Discount,
                                as: 'discounts',
                                where: {
                                    valid_until: { [Op.gte]: new Date() },
                                    date_valid: { [Op.lte]: new Date() }
                                }
                            },
                        }
                    ],
                },
                {
                    model: Models.Discount,
                    as: 'discount'
                },
                {
                    model: Models.PaymentType,
                    as: 'payment_type'
                },
                {
                    model: Models.Store,
                    as: 'store'
                },
            ]
        })

        let invoice = await Models.Invoice.findOne({ where: { sales_id: id } })

        // Calculate session

        if (invoice && (items || discount_id || deleteItems)) {

            let discount = 0
            let sub_total = 0
            let total = 0

            if (updatedSale.items?.length > 0) {
                for (let i = 0; i < updatedSale.items?.length; i++) {
                    if (updatedSale.items[i].product_id) {
                        if (updatedSale.items[i]?.product?.discounts?.length > 0) {
                            for (let j = 0; j < updatedSale.items[i]?.product?.discounts?.length; j++) {
                                const disc = updatedSale.items[i]?.product?.discounts[j]
                                if (
                                    !(disc.min_items_qty > 0 && (disc.min_items_qty > updatedSale.items[i]?.qty)) &&
                                    !(disc.max_items_qty > 0 && (disc.max_items_qty < updatedSale.items[i]?.qty))
                                ) {
                                    let multiply = disc.multiplication > 0 ? Math.floor(updatedSale.items[i]?.qty/(disc.multiplication || 0)) : 1 
                                    let itemPrices = (updatedSale.items[i]?.product?.price || 0)
                                    if (!(disc.min_items_qty > 0) && !(disc.max_items_qty > 0)) itemPrices = itemPrices * updatedSale.items[i]?.qty
                                    if (disc.max_items_qty > 0) itemPrices = itemPrices * disc.max_items_qty

                                    if (disc.is_percentage) {
                                        if (disc.multiplication > 0) {
                                            discount += ((updatedSale.items[i]?.product?.price || 0) * (disc.percentage / 100)) * multiply
                                        } else discount += itemPrices * (disc.percentage / 100)
                                    } else {
                                        if (!(disc.min_items_qty > 0) && !(disc.max_items_qty > 0)) discount += disc.nominal*updatedSale.items[i]?.qty
                                        else discount += disc.nominal*multiply
                                    } 
                                }
                            }
                        }
                        sub_total += (updatedSale.items[i]?.product?.price || 0) * updatedSale.items[i].qty
                    }
                    if (updatedSale.items[i].variant_id) {
                        if (updatedSale.items[i]?.variant?.discounts?.length > 0) {
                            for (let j = 0; j < updatedSale.items[i]?.variant?.discounts?.length; j++) {
                                const disc = updatedSale.items[i]?.variant?.discounts[j]
                                if (
                                    !(disc.min_items_qty > 0 && (disc.min_items_qty > updatedSale.items[i]?.qty)) &&
                                    !(disc.max_items_qty > 0 && (disc.max_items_qty < updatedSale.items[i]?.qty))
                                ) {
                                    let multiply = disc.multiplication > 0 ? Math.floor(updatedSale.items[i]?.qty/(disc.multiplication || 0)) : 1 
                                    let itemPrices = (updatedSale.items[i]?.variant?.price || 0)
                                    if (!(disc.min_items_qty > 0) && !(disc.max_items_qty > 0)) itemPrices = itemPrices * updatedSale.items[i]?.qty
                                    if (disc.max_items_qty > 0) itemPrices = itemPrices * disc.max_items_qty
                                    
                                    if (disc.is_percentage) {
                                        if (disc.multiplication > 0) {
                                            discount += ((updatedSale.items[i]?.variant?.price || 0) * (disc.percentage / 100)) * multiply
                                        } else discount += itemPrices * (disc.percentage / 100)
                                    } else {
                                        console.log(Math.max(Math.floor(updatedSale.items[i]?.qty/(disc.multiplication || 0)), 1) )
                                        console.log(updatedSale.items[i]?.qty)
                                        console.log((disc.multiplication || 0))
                                        console.log((updatedSale.items[i]?.qty/(disc.multiplication || 0)))
                                        console.log(3/0)
                                        console.log(discount)
                                        console.log(disc.nominal)
                                        console.log(multiply)
                                        console.log(discount += disc.nominal*multiply)
                                        if (!(disc.min_items_qty > 0) && !(disc.max_items_qty > 0)) discount += disc.nominal*updatedSale.items[i]?.qty
                                        else discount += disc.nominal*multiply
                                    } 
                                }
                            }
                        }
                        sub_total += (updatedSale.items[i]?.variant?.price || 0) * updatedSale.items[i].qty
                    }
                    if (updatedSale.items[i].packet_id) {
                        if (updatedSale.items[i]?.packet?.discounts?.length > 0) {
                            for (let j = 0; j < updatedSale.items[i]?.packet?.discounts?.length; j++) {
                                const disc = updatedSale.items[i]?.packet?.discounts[j]
                                if (
                                    !(disc.min_items_qty > 0 && (disc.min_items_qty > updatedSale.items[i]?.qty)) &&
                                    !(disc.max_items_qty > 0 && (disc.max_items_qty < updatedSale.items[i]?.qty))
                                ) {
                                    let multiply = disc.multiplication > 0 ? Math.floor(updatedSale.items[i]?.qty/(disc.multiplication || 0)) : 1 
                                    let itemPrices = (updatedSale.items[i]?.packet?.price || 0)
                                    if (!(disc.min_items_qty > 0) && !(disc.max_items_qty > 0)) itemPrices = itemPrices * updatedSale.items[i]?.qty
                                    if (disc.max_items_qty > 0) itemPrices = itemPrices * disc.max_items_qty
                                    
                                    if (disc.is_percentage) {
                                        if (disc.multiplication > 0) {
                                            discount += ((updatedSale.items[i]?.packet?.price || 0) * (disc.percentage / 100)) * multiply
                                        } else discount += itemPrices * (disc.percentage / 100)
                                    } else {
                                        if (!(disc.min_items_qty > 0) && !(disc.max_items_qty > 0)) discount += disc.nominal*updatedSale.items[i]?.qty
                                        else discount += disc.nominal*multiply
                                    }
                                }
                            }
                        }
                        sub_total += (updatedSale.items[i]?.packet?.price || 0) * updatedSale.items[i].qty
                    }
                }
            }

            if (updatedSale.discount_id) {
                if (updatedSale.discount?.is_percentage) discount = sub_total * (updatedSale.discount?.percentage / 100)
                else discount = updatedSale.discount?.nominal
            }

            total = sub_total - discount

            invoice.sub_total = sub_total
            invoice.discount = discount
            invoice.total = total
            invoice.updated_at = Date.now();
            await invoice.save();
            updatedSale.total = total
            await updatedSale.save()

        } else if (!invoice) {

            let discount = 0
            let sub_total = 0
            let total = 0

            if (updatedSale.items?.length > 0) {
                for (let i = 0; i < updatedSale.items?.length; i++) {
                    if (updatedSale.items[i].product_id) {
                        sub_total += (updatedSale.items[i]?.product?.price || 0) * updatedSale.items[i].qty
                    }
                    if (updatedSale.items[i].variant_id) {
                        sub_total += (updatedSale.items[i]?.variant?.price || 0) * updatedSale.items[i].qty
                    }
                    if (updatedSale.items[i].packet_id) {
                        sub_total += (updatedSale.items[i]?.packet?.price || 0) * updatedSale.items[i].qty
                    }
                }
                total = sub_total
            }

            if (updatedSale.discount_id) {
                if (updatedSale.discount?.is_percentage) {
                    discount = sub_total * (updatedSale.discount?.percentage / 100)
                    total = sub_total - discount
                } else {
                    discount = updatedSale.discount?.nominal
                    total = sub_total - discount
                }
            }

            const newInvoice = {
                code: `INV${Date.now()}`,
                sales_id: sale.id,
                sub_total,
                discount,
                total
            }

            invoice = await Models.Invoice.create(newInvoice);
            updatedSale.total = total
            await updatedSale.save()
        }

        return res.response(RES_TYPES[200](updatedSale, `Penjualan ${updatedSale.code} telah diubah`)).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500](error)).code(500);
    }
}

const handlerCreatePayment = async (req, res) => {

    const img_name = await new Promise((resolve, reject) => {
        const singleUpload = ImageUploader.single('img');
        singleUpload(req.raw.req, req.raw.res, (err) => {
            if (err) reject(err);
            resolve(req.payload.file ? req.payload.file.filename : null);
        });
    });
    
    const {
        sales_id,
        cash,
        account_bank,
        account_number,
        receiver_account_bank,
        receiver_account_number,
        nominal
    } = req.payload?.body || {}

    if (!sales_id) return res.response(RES_TYPES[400]('Penjualan harus diisi!')).code(400);

    const sale = await Models.Sale.findOne({
        where: { id: sales_id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
            {
                model: Models.Invoice,
                as: 'invoice',
            },
            {
                model: Models.PaymentType,
                as: 'payment_type'
            },
            {
                model: Models.SaleItem,
                as: 'items'
            }
        ]
    })

    if (!sale) return res.response(RES_TYPES[400]('Penjualan tidak ditemukan!')).code(400);
    if (sale.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (sale.items?.length == 0) return res.response(RES_TYPES[400]('Penjualan ini belum memiliki item!')).code(400);
    if (!sale.invoice) return res.response(RES_TYPES[400]('Invoice tidak ditemukan!')).code(400);
    if (sale.status == 1) return res.response(RES_TYPES[400]('Penjualan ini sudah lunas!')).code(400);

    const invoice = await Models.Invoice.findOne({ where: { id: sale.invoice.id } })

    try {
        if (!sale.payment_type_id) return res.response(RES_TYPES[400]('Penjualan belum memiliki tipe pembayaran!')).code(400);
        if (sale.payment_type?.code == "BT") {

            if (!account_bank || !account_number || !receiver_account_bank || !receiver_account_number || !nominal) return res.response(RES_TYPES[400]('Mohon lengkapi data pembayaran terlebih dahulu!')).code(400);
            
            if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

            const newPayment = {
                code: `PY${Date.now().toString()}`,
                account_bank,
                account_number,
                receiver_account_bank,
                receiver_account_number,
                nominal,
                img: req?.url?.origin + '/images/' + img_name
            }
    
            const payment = await Models.Payment.create(newPayment)
    
            if (!payment) return res.response(RES_TYPES[400]('Pembayaran gagal ditambahkan!')).code(400);
    
            invoice.status = 1
            invoice.payment_id = payment.id
            sale.status = 1
        } else {
            if (!cash) return res.response(RES_TYPES[400]('Uang tunai harus diisi!')).code(400);
            if (cash < invoice.total) return res.response(RES_TYPES[400]('Uang tunai kurang!')).code(400);
            invoice.cash = cash
            invoice.change_money = cash - invoice.total
            invoice.status = 1
            sale.status = 1
        }
    
        await invoice.save();
        await sale.save();
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500](error)).code(500);
    }

    const updatedSale = await Models.Sale.findOne({
        where: { id: sales_id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
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
                model: Models.PaymentType,
                as: 'payment_type'
            }
        ]
    })

    return res.response(RES_TYPES[200](updatedSale, `Penjualan ${sale.code} lunas`)).code(200);
}

const handlerDeleteSales = async (req, res) => {

    const id = req.params.id
    const sale = await Models.Sale.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            },
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
                as: 'items'
            }
        ]
    })

    if (!sale) return res.response(RES_TYPES[400]('Penjualan tidak ditemukan!')).code(400);
    if (sale.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (sale.status == 1) return res.response(RES_TYPES[400]('Penjualan ini tidak dapat di hapus!')).code(400);

    try {
        if (sale.items?.length > 0) for (let i = 0; i < sale.items?.length; i++) await Models.SaleItem.destroy({ where: { id: sale.items[i].id } })
        if (sale.invoice) {
            if (sale.invoice.payment_id) await Models.Payment.destroy({ where: { id: sale.invoice.payment_id } })
            await Models.Invoice.destroy({ where: { id: sale.invoice.id } })
        }
        await sale.destroy()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500](error)).code(500);
    }

    return res.response(RES_TYPES[200](sale, `Penjualan ${sale.code} telah dihapus`)).code(200);
}

module.exports = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchSales
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllSales
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetSale
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetSaleByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateSale,
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/payment',
        handler: handlerCreatePayment,
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
        handler: handlerUpdateSale
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteSales
    },
]