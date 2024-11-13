const Jwt = require('jsonwebtoken')
const keys = require('../../keys')
const bcrypt = require("bcryptjs");
const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { generateRandomString, sendEmail } = require('../../utils');
const abs_path = base_path + "/auth"

// Handlers

const handlerLogin = async (req, res) => {

    const { email, password } = req.payload

    // Check form data
    if (!email) return res.response(RES_TYPES[400]('Email harus diisi')).code(400);
    if (!password) return res.response(RES_TYPES[400]('Password harus diisi')).code(400);
    
    // Check user
    const user = await Models.User.findOne({
        where: { email },
        include: { 
            model: Models.Store, 
            as: 'stores',
            where: { is_active: true },
            required: false,
        }
    })

    if (user) {

        // Check password
        const isMatch = await bcrypt.compare(password, user.password)

        // Password missmatch
        if (!isMatch) return res.response(RES_TYPES[400]('Password salah')).code(400);

        // Password match
        else {
            
            const payload = {
                id: user.id,
                email: user.email,
                name: user.name,
            }

            const token = Jwt.sign({ user: payload }, keys.JWT_SECRET_KEY, { expiresIn: "10d" });
            const refresh_token = Jwt.sign({ user: payload }, keys.JWT_SECRET_KEY, { expiresIn: '30d' });
            
            // Token created and user successfully logged in
            if (token && refresh_token) {

                // Save refresh token
                user.refresh_token = refresh_token
                user.save()

                return res.response(RES_TYPES[200]({
                    ...user.toJSON(),
                    token,
                    refresh_token: refresh_token
                })).code(200);
            }
            
            // Token failed to create
            return res.response(RES_TYPES[400]('Gagal membuat token!')).code(400);
        }
    } else return res.response(RES_TYPES[400]('Pengguna tidak ditemukan!')).code(400);
}

const handlerRegister = async (req, res) => {

    const { name, email, phone, password, confirm_password } = req.payload || {}

    if (!name || !email || !phone || !password || !confirm_password) return res.response(RES_TYPES[400]('Data belum lengkap')).code(400);

    if (password != confirm_password) return res.response(RES_TYPES[400]('Password tidak cocok' )).code(400);

    // Search for existing user
    const user = await Models.User.findOne({ where: { email } })

    // If exist user
    if (user) return res.response(RES_TYPES[400]('Email sudah terdaftar!')).code(400);

    // Register user if user not exist
    // Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(password, salt)
    
    // Registering
    const newUser = Models.User.create({
        name,
        email,
        phone,
        username: `${name?.slice(5)?.toLowerCase()}${generateRandomString(5)}`,
        password: hashed_password,
        privilege: 1
    })

    if (!newUser) return res.response(RES_TYPES[400]('Registrasi gagal!')).code(400);

    // Send response 
    return res.response(RES_TYPES[200](newUser)).code(200);
}

const handlerSignStore = async (req, res) => {

    const {
        store_id,
        device_id,
    } = req.payload || {}

    if (!store_id && !device_id) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const existDevice = await Models.Device.findOne({
        where: { device_id },
        include: { model: Models.Store, as: 'store' }
    })

    if (existDevice) {
        // return res.response(RES_TYPES[400](`Device sudah terdaftar! Device digunakan pada toko ${existDevice.store.name}`)).code(400);
        existDevice.store_id = store_id
        existDevice.save()
        return res.response(RES_TYPES[200](existDevice)).code(200);
    } else {

        const newDevice = await Models.Device.create({
            device_id,
            store_id
        })
    
        if (!newDevice) return res.response(RES_TYPES[400]('Gagal masuk ke toko!')).code(400);
    
        return res.response(RES_TYPES[200](newDevice)).code(200);
    }

}

const handlerSignOutStore = async (req, res) => {

    const {
        store_id,
        device_id
    } = req.payload || {}

    if (!store_id && !device_id) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

    try {
        await Models.Device.destroy({ where: { device_id, store_id } })
        return res.response(RES_TYPES[200](null, "Berhasil keluar dari toko")).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerRequestResetPassword = async (req, res) => {

    const { email } = req.payload || {}

    if (!email) return res.response(RES_TYPES[400]('Email harus diisi')).code(400);

    const user = await Models.User.findOne({ where: { email } })

    if (!user) return res.response(RES_TYPES[400]('Email tidak ditemukan!')).code(400);

    // // Generate token validate until 15 minutes
    const token = Jwt.sign({ id: user?.id }, keys.JWT_SECRET_KEY, { expiresIn: 15 * 60 * 1000 });
    await user.update({ reset_password_token: token, updated_at: (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:') })

    sendEmail(
        email,
        'Link Reset Password',
        `Hallo, berikut adalah link reset password kamu:\n\n${req?.url?.origin}/reset-password?token=${token}\n\nTerima kasih.`,
    );

    return res.response(RES_TYPES[200](null, "Request reset password success, reset password link has been sent to your email")).code(200);
}

const handlerRefreshToken = async (req, res) => {

    const { refresh_token } = req.payload;

    // Check if refresh token is provided
    if (!refresh_token) return res.response(RES_TYPES[400]('Refresh token harus diisi')).code(400);

    // Verify refresh token
    return await Jwt.verify(refresh_token, keys.JWT_SECRET_KEY, async (err, decoded) => {

        // Refresh token not valid
        if (err) return res.response(RES_TYPES[400]('Refresh token tidak valid')).code(400);

        // Check if refresh token is stored in database
        const user = await Models.User.findOne({ where: { refresh_token: refresh_token } });

        if (!user) return res.response(RES_TYPES[400]('Refresh token tidak ditemukan')).code(400);

        // Create new access token
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
        };

        // Generate new token
        const token = Jwt.sign({ user: payload }, keys.JWT_SECRET_KEY, { expiresIn: '10d' });
        const newRefreshToken = Jwt.sign({ user: payload }, keys.JWT_SECRET_KEY, { expiresIn: '30d' });
  
        // Update refresh token in database
        user.refresh_token = newRefreshToken;
        user.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:');
        user.save();
        
        return res.response(RES_TYPES[200]({ user_id: user.id, token, refresh_token: newRefreshToken })).code(200);
    });
};

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/register',
        handler: handlerRegister,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/login',
        handler: handlerLogin,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/request-reset-password',
        handler: handlerRequestResetPassword,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/refresh-token',
        handler: handlerRefreshToken,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/sign-store',
        handler: handlerSignStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path + '/sign-out-store',
        handler: handlerSignOutStore
    }
]

module.exports = routes