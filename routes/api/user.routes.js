const Jwt = require('jsonwebtoken')
const keys = require('../../keys')
const bcrypt = require("bcryptjs");
const Models = require('../../models')
const { base_path } = require('./api.config');
const Path = require('path');
const fs = require('fs');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { ImageUploader } = require('../../utils');
const { Op } = require('sequelize');
const abs_path = base_path + "/user"

// Handlers

const handlerSearchUser = async (req, res) => {

    try {

        const {
            search_text,
            page = 1,
            per_page = 15
        } = req.query

        if (!search_text) return res.response(RES_TYPES[200]([])).code(200);

        const users = await Models.User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${search_text}%` } },
                    { email: { [Op.like]: `%${search_text}%` } },
                    { username: { [Op.like]: `%${search_text}%` } }
                ]
            },
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](users)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerResetPassword = async (req, res) => {

    const { token, password, confirm_password } = req.payload || {}

    if (!token || !password || !confirm_password) return res.response(RES_TYPES[400]('Data belum lengkap')).code(400);

    if (password != confirm_password) return res.response(RES_TYPES[400]('Password tidak cocok' )).code(400);

    // Search for existing user
    const user = await Models.User.findOne({ where: { reset_password_token: token } })

    // If exist user
    if (!user) return res.response(RES_TYPES[400]('Token tidak ditemukan!')).code(400);

    // Check if token not expired

    // Decode token
    const decoded = Jwt.verify(token, keys.JWT_SECRET_KEY);

    // If token expired
    if (decoded.exp < Date.now()/1000) return res.response(RES_TYPES[400]('Token kadalwarsa!')).code(400);

    // Reset password

    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt)
    
    // Registering
    user.password = hashed_password;
    user.reset_password_token = null;
    user.updated_at = new Date();
    user.save();

    // Send response 
    return res.response(RES_TYPES[200](user)).code(200);
}

const handlerGetAllUsers = async (req, res) => {

    const users = await Models.User.findAll({
        attributes: { exclude: ['password', 'reset_password_token'] },
        include: {
            model: Models.Store,
            as: 'stores',
            where: { is_active: true }
        }
    })
    return res.response(RES_TYPES[200](users)).code(200);
}

const handlerGetUser = async (req, res) => {

    const id = req.params.id
    const user = await Models.User.findOne({
        where: { id },
        include: {
            model: Models.Store,
            as: 'stores',
            where: { is_active: true }
        }
    })

    if (!user) return res.response(RES_TYPES[400]('Pengguna tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](user)).code(200);
}

const handlerUpdatePhoto = async (req, res) => {

    const id = req.params.id

    if ((req.user?.privilege > 0) && (req.auth.credentials?.user?.id != id)) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const user = await Models.User.findOne({ where: { id } })

    if (!user) return res.response(RES_TYPES[400]('Pengguna tidak ditemukan!')).code(400);

    const img_name = await new Promise((resolve, reject) => {
        const uploadSingle = ImageUploader.single('file');
        uploadSingle(req.raw.req, req.raw.res, (err) => {
            if (err) reject(err);
            resolve(req.payload.file ? req.payload.file.filename : null);
        });
    });

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    if (user.profile_photo) {
        const img_name = user.profile_photo.split('/images/')[1]
        const imagesPath = Path.join(__dirname, `../../public/images/${img_name}`);
        if (fs.existsSync(imagesPath)) await fs.unlinkSync(imagesPath);
    }

    user.profile_photo = req?.url?.origin + '/images/' + img_name
    user.updated_at = new Date();
    user.save();

    // Send response 
    return res.response(RES_TYPES[200](user, "Upload gambar sukses")).code(200);
}

const handlerUpdateUser = async (req, res) => {

    const id = req.params.id
    const { name, email, phone, address, password } = req.payload || {}
    
    if (!name && !email && !phone && !address && !password) return res.response(RES_TYPES[400]('Tidak ada data yang dikirimkan untuk diubah!')).code(400);
    
    const user = await Models.User.findOne({ where: { id } })

    if ((req.user?.privilege > 0) && (req.auth.credentials?.user?.id != id)) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (!user) return res.response(RES_TYPES[400]('Pengguna tidak ditemukan!')).code(400);

    if (password) {
        // Hashing password
        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt)
        user.password = hashed_password
    }
    if (name) user.name = name
    if (email) user.email = email
    if (phone) user.phone = phone
    if (address) user.address = address

    user.updated_at = new Date();
    user.save()

    return res.response(RES_TYPES[200](user)).code(200);
}

const handlerDeleteUser = async (req, res) => {

    const id = req.params.id

    if ((req.user?.privilege > 0) && (req.auth.credentials?.user?.id != id)) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const user = await Models.User.findOne({ where: { id } })

    if (!user) return res.response(RES_TYPES[400]('Pengguna tidak ditemukan!')).code(400);

    user.is_active = false
    user.save()
    
    return res.response(RES_TYPES[200](null, `Pengguna ${user.name} berhasil di hapus`)).code(200);
}

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchUser,
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/reset-password',
        handler: handlerResetPassword,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllUsers,
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetUser,
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateUser,
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteUser,
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}/update-photo',
        handler: handlerUpdatePhoto,
        options: {
            payload: {
                output: 'stream',
                parse: false,
                allow: 'multipart/form-data',
                maxBytes: 1 * 1024 * 1024
            }
        }
    }
]

module.exports = routes