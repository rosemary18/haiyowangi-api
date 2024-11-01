const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const abs_path = base_path + "/notification"

// Handlers

const handlerGetNotifications = async (req, res) => {

    const notifications = await Models.Notification.findAll()
    return res.response(RES_TYPES[200](notifications)).code(200);
}

const handlerGetNotification = async (req, res) => {

    const id = req.params.id
    const notification = await Models.Notification.findOne({ where: { id } })

    if (!notification) return res.response(RES_TYPES[400]('Notifikasi tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200](notification?.toJSON())).code(200);
}

const handlerGetNotificationByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (req.auth.credentials?.user?.id != store?.owner_id) {
        return res.response(RES_TYPES[400]("Anda tidak punya akses!")).code(200);
    }

    const {
        is_read,
        page = 1,
        per_page = 15
    } = req.query

    const filter = { store_id: id }
    if (is_read != undefined) filter.is_read = is_read

    // Hitung total notifikasi yang sesuai dengan filter
    const totalNotifications = await Models.Notification.count({ where: filter });

    const notifications = await Models.Notification.findAll({
        where: filter,
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page),
        order: [['id', 'DESC']],
    });

    const countNotificationsUnread = await Models.Notification.count({ where: { store_id: id, is_read: false } });

    const totalPages = Math.ceil(totalNotifications / parseInt(per_page));

    return res.response(RES_TYPES[200]({
        notifications,
        unread: countNotificationsUnread,
        current_page: parseInt(page),
        total_page: totalPages
    })).code(200);
}

const handlerReadNotification = async (req, res) => {

    const id = req.params.id
    const notification = await Models.Notification.findOne({ where: { id } })
 
    if (!notification) return res.response(RES_TYPES[400]('Notifikasi tidak ditemukan!')).code(400);

    const store = await Models.Store.findOne({ where: { id: notification.store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);
    if (notification.is_read) return res.response(RES_TYPES[400]('Notifikasi sudah dibaca!')).code(400);

    // Mark as read

    notification.is_read = true
    notification.save()
    return res.response(RES_TYPES[200](notification.toJSON())).code(200);
}

const handlerReadNotificationStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    // Mark as read

    await Models.Notification.update({ is_read: true }, { where: { store_id: id, is_read: false } })
    
    return res.response(RES_TYPES[200](null, "Success")).code(200);
}

const handlerDeleteNotification = async (req, res) => {

    const id = req.params.id
    const notification = await Models.Notification.findOne({ where: { id } })
    const store = await Models.Store.findOne({ where: { id: notification.store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (!notification) return res.response(RES_TYPES[400]('Notifikasi tidak ditemukan!')).code(400);
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Notifikasi bukan milik toko ini!')).code(400);

    // Delete

    notification.destroy()
    return res.response(RES_TYPES[200](notification.toJSON())).code(200);
}

const handlerDeleteAllNotificationByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    // Delete

    await Models.Notification.destroy({ where: { store_id: id } })
    return res.response(RES_TYPES[200](null, `Notifikasi dari toko ${store.name} telah di hapus`)).code(200);
}

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetNotifications,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetNotification,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetNotificationByStore
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerReadNotification
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/store/{id}',
        handler: handlerReadNotificationStore
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/store/{id}',
        handler: handlerDeleteAllNotificationByStore
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteNotification
    },
]

module.exports = routes