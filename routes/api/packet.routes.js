const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/packet"

// Handlers

const handlerGetAllPackets = async (req, res) => {
    
    try {
        const packets = await Models.Packet.findAll({
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
        return res.response(RES_TYPES[200](packets)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetPacket = async (req, res) => {

    const id = req.params.id
    const packet = await Models.Packet.findOne({
        where: { id },
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

    if (!packet) return res.response(RES_TYPES[400]('Paket tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200](packet)).code(200);
}

const handlerGetPacketByStore = async (req, res) => {

    const store_id = req.params.id
    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth?.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const {
        search_text,
        order_by = 'id',
        order_type = 'DESC',
        page = 1,
        per_page = 15  
    } = req.query

    const filter = { store_id }
    if (search_text) {
        const searchs = search_text.split(' ');
        const ors = searchs.map(search => ({ name: { [Op.like]: `%${search}%` } }));
        filter[Op.or] = ors;
    }
    
    const packets = await Models.Packet.findAll({
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
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!packets) return res.response(RES_TYPES[400]('Paket tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200](packets)).code(200);
}

const handlerGetAllPacketItems = async (req, res) => {

    try {
        const packetItems = await Models.PacketItem.findAll({
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
        })
    
        if (!packetItems) return res.response(RES_TYPES[400]('Paket item tidak ditemukan!')).code(400);
        
        return res.response(RES_TYPES[200](packetItems)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerCreatePacket = async (req, res) => {

    const {
        name,
        description,
        price,
        store_id,
        is_published = false,
        items
    } = req.payload || {}

    if (!name || !price || !store_id || !items) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

    if (store.owner_id !== req.auth.credentials.user?.id) return res.response(RES_TYPES[400]('Anda tidak mempunyai akses!')).code(400);

    const packet = await Models.Packet.create({
        name,
        description,
        price,
        is_published,
        store_id
    })

    if (!packet) return res.response(RES_TYPES[400]('Paket gagal ditambahkan!')).code(400);

    try {
        for (const item of items) {
            await Models.PacketItem.create({
                packet_id: packet.id,
                product_id: item?.product_id,
                variant_id: item?.variant_id,
                qty: item?.qty || 1
            })
        }
    } catch (error) {
        console.log(error)
        await Models.Packet.destroy({ where: { id: packet.id } })
        return res.response(RES_TYPES[400]('Paket gagal ditambahkan!')).code(400);
    }

    const addedPacket = await Models.Packet.findOne({
        where: { id: packet.id },
        include: [
            {
                model: Models.PacketItem,
                as: 'items'
            }
        ]
    })

    return res.response(RES_TYPES[200](addedPacket, `Paket ${name} ditambahkan`)).code(200);
}

const handlerAddPacketItem = async (req, res) => {

    const packet_id = req.params.id
    const { items } = req.payload || {}

    if (!items) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    const packet = await Models.Packet.findOne({
        where: { id: packet_id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!packet) return res.response(RES_TYPES[400]('Paket tidak ditemukan!')).code(400);
    if (packet.store.owner_id !== req.auth.credentials.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        for (const item of items) {
            await Models.PacketItem.create({
                packet_id,
                product_id: item?.product_id,
                variant_id: item?.variant_id,
                qty: item?.qty || 1
            })
        }
    } catch (error) {
        return res.response(RES_TYPES[400]('Paket item gagal ditambahkan!')).code(400);
    }

    return res.response(RES_TYPES[200](null, `Item paket ${packet.name} ditambahkan!`)).code(200);
}

const handlerUpdatePacket = async (req, res) => {

    const id = req.params.id
    const {
        name,
        description,
        price,
        is_published
    } = req.payload || {}

    if (!name && !description && !price) return res.response(RES_TYPES[400]('Tidak ada data yang diupdate!')).code(400);
    
    const packet = await Models.Packet.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!packet) return res.response(RES_TYPES[400]('Paket tidak ditemukan!')).code(400);
    if (packet.store.owner_id !== req.auth.credentials.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name) packet.name = name
    if (description) packet.description = description
    if (price) packet.price = price
    if (is_published != undefined) packet.is_published = is_published

    packet.updated_at = new Date();
    
    try {
        await packet.save()
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](packet, `Paket ${name} diupdate`)).code(200);
}

const handlerUpdatePacketItem = async (req, res) => {

    const id = req.params.id
    const {
        qty
    } = req.payload || {}

    if (!qty) return res.response(RES_TYPES[400]('Tidak ada data yang diupdate!')).code(400);
    
    const packetItem = await Models.PacketItem.findOne({
        where: { id },
        include: [
            {
                model: Models.Packet,
                as: 'packet',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!packetItem) return res.response(RES_TYPES[400]('Paket item tidak ditemukan!')).code(400);
    if (packetItem.packet.store.owner_id !== req.auth.credentials.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (qty) packetItem.qty = qty

    packetItem.updated_at = new Date();
    
    try {
        await packetItem.save()
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](packetItem, `Paket item ${packetItem.packet.name} diupdate`)).code(200);
}

const handlerDeletePacket = async (req, res) => {

    const id = req.params.id
    const packet = await Models.Packet.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!packet) return res.response(RES_TYPES[400]('Paket tidak ditemukan!')).code(400);
    if (packet.store.owner_id !== req.auth.credentials.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const existSalesItems = await Models.SaleItem.findAll({ where: { packet_id: id } })

    if (existSalesItems.length > 0) return res.response(RES_TYPES[400]('Paket yang sudah digunakan tidak dapat di hapus!')).code(400);

    try {
        await Models.PacketItem.destroy({ where: { packet_id: id } })
        await Models.Packet.destroy({ where: { id } })
    } catch (error) {
        return res.response(RES_TYPES[400]('Paket gagal di hapus!')).code(400);
    }

    return res.response(RES_TYPES[200](null, `Paket ${packet.name} di hapus`)).code(200);
}

const handlerDeletePacketItem = async (req, res) => {

    const id = req.params.id
    const packetItem = await Models.PacketItem.findOne({
        where: { id },
        include: [
            {
                model: Models.Packet,
                as: 'packet',
                include: [
                    {
                        model: Models.Store,
                        as: 'store'
                    }
                ]
            }
        ]
    })

    if (!packetItem) return res.response(RES_TYPES[400]('Paket item tidak ditemukan!')).code(400);
    if (packetItem.packet.store.owner_id !== req.auth.credentials.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        await Models.PacketItem.destroy({ where: { id } })
    } catch (error) {
        return res.response(RES_TYPES[400]('Paket item gagal di hapus!')).code(400);
    }

    return res.response(RES_TYPES[200](null, `Paket item ${packetItem.packet.name} berhasil di hapus`)).code(200);
}

// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllPackets
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetPacket
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/item',
        handler: handlerGetAllPacketItems
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetPacketByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreatePacket
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/{id}/add-item',
        handler: handlerAddPacketItem
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdatePacket
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/item/{id}',
        handler: handlerUpdatePacketItem
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeletePacket
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/item/{id}',
        handler: handlerDeletePacketItem
    }
]

module.exports = routes