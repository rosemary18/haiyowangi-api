const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { ImageUploader, generateRandomString } = require('../../utils');
const Path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const abs_path = base_path + "/staff"

// Handlers

const handlerSearchStaff = async (req, res) => {

    try {

        const {
            search_text,
            store_id,
            order_by = 'id',
            order_type = 'ASC',
            page = 1,
            per_page = 15
        } = req.query

        if (!store_id) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

        const store = await Models.Store.findOne({ where: { id: store_id } })
        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
        if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

        if (!search_text) return res.response(RES_TYPES[200]([])).code(200);

        const staffs = await Models.Staff.findAll({
            where: {
                store_id,
                [Op.or]: [
                    { code: { [Op.like]: `%${search_text}%` } },
                    { name: { [Op.like]: `%${search_text}%` } },
                    { email: { [Op.like]: `%${search_text}%` } },
                    { phone: { [Op.like]: `%${search_text}%` } }
                ]
            },
            order: [[order_by, order_type]],
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](staffs)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetStaffs = async (req, res) => {
    
    const staffs = await Models.Staff.findAll()
    return res.response(RES_TYPES[200](staffs)).code(200);
}

const handlerGetStaff = async (req, res) => {

    const id = req.params.id
    const staff = await Models.Staff.findOne({ where: { id } })

    if (!staff) return res.response(RES_TYPES[400]('Staff tidak ditemukan!')).code(400);
    
    return res.response(RES_TYPES[200](staff)).code(200);
}

const handlerGetStaffByStore = async (req, res) => {

    try {

        const id = req.params.id
        const store = await Models.Store.findOne({ where: { id } })

        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);

        const {
            search_text,
            order_by = 'id',
            order_type = 'DESC',
            page = 1,
            per_page = 15
        } = req.query

        const staffs = await Models.Staff.findAll({
            where: {
                store_id: id,
                [Op.or]: [
                    { code: { [Op.like]: `%${search_text}%` } },
                    { name: { [Op.like]: `%${search_text}%` } },
                    { email: { [Op.like]: `%${search_text}%` } },
                    { phone: { [Op.like]: `%${search_text}%` } }
                ]
            },
            order: [[order_by, order_type]],
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        if (!staffs) return res.response(RES_TYPES[400]('Staff tidak ditemukan!')).code(400);

        return res.response(RES_TYPES[200](staffs)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerCreateStaff = async (req, res) => {

    const {
        store_id,
        name,
        email,
        phone,
        address,
        date_joined,
        salary,
        pos_passcode,
        is_cashier
    } = req.payload || {}

    if (!store_id || !name || !email || !phone || !address || !date_joined || !salary || !is_cashier) return res.response(RES_TYPES[400]('Data tidak lengkap!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newStaff = {
        code: `ST${((new Date()).getFullYear()).toString().slice(-2)}${generateRandomString(4, true, false, false)}`,
        store_id,
        name,
        email,
        phone,
        address,
        date_joined,
        salary,
        is_cashier
    }

    if (is_cashier) newStaff.pos_passcode = pos_passcode

    const staff = await Models.Staff.create(newStaff)

    if (!staff) return res.response(RES_TYPES[400]('Staff gagal dibuat!')).code(400);

    await Models.Notification.create({
        title: 'Staff Baru',
        message: `${staff.name} baru saja ditambahkan sebagai staff`,
        store_id: staff.store_id
    })

    return res.response(RES_TYPES[200](staff)).code(200);
}

const handlerUpdatePhoto = async (req, res) => {

    const id = req.params.id
    const staff = await Models.Staff.findOne({ where: { id } })

    if (!staff) return res.response(RES_TYPES[400]('Staff tidak ditemukan!')).code(400);
    
    const store = await Models.Store.findOne({ where: { id: staff.store_id } })
    
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const img_name = await new Promise((resolve, reject) => {
        const uploadSingle = ImageUploader.single('file');
        uploadSingle(req.raw.req, req.raw.res, (err) => {
            if (err) reject(err);
            resolve(req.payload.file ? req.payload.file.filename : null);
        });
    });

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    if (staff.profile_photo) {
        const img_name = staff.profile_photo.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
    }

    staff.profile_photo = req?.url?.origin + '/images/' + img_name
    
    try {
        staff.updated_at = new Date()
        await staff.save()
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }

    return res.response(RES_TYPES[200](staff)).code(200);
}

const handlerUpdateStaff = async (req, res) => {
    
    const id = req.params.id
    const { name, email, phone, address, date_joined, status, salary, pos_passcode, is_cashier } = req.payload || {}
    
    const staff = await Models.Staff.findOne({ where: { id } })
   
    if (!staff) return res.response(RES_TYPES[400]('Staff tidak ditemukan!')).code(400);
    
    const store = await Models.Store.findOne({ where: { id: staff.store_id } })
    
    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name) staff.name = name
    if (email) staff.email = email
    if (phone) staff.phone = phone
    if (address) staff.address = address
    if (date_joined) staff.date_joined = date_joined
    if (status) staff.status = status
    if (salary) staff.salary = salary
    if (pos_passcode) staff.pos_passcode = pos_passcode
    if (is_cashier) staff.is_cashier = is_cashier

    staff.updated_at = new Date()
    await staff.save()

    return res.response(RES_TYPES[200](staff), 'Staff berhasil diperbarui').code(200);
}

const handlerDeleteStaff = async (req, res) => {
    const id = req.params.id
    const staff = await Models.Staff.findOne({ where: { id } })
    if (!staff) return res.response(RES_TYPES[400]('Staff tidak ditemukan!')).code(400);
    const isDeleted = await staff.destroy()
    if (!isDeleted) return res.response(RES_TYPES[400]('Staff gagal dihapus!')).code(400);
    const img = staff.profile_photo
    if (img) {
        const img_name = img.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
    }
    return res.response(RES_TYPES[200](null, `Staff ${staff.name} berhasil dihapus`)).code(200);
}


// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchStaff
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetStaffs
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetStaff
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetStaffByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateStaff
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
        handler: handlerUpdateStaff
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteStaff
    }
]

module.exports = routes