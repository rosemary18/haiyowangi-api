const { FETCH_REQUEST_TYPES, RES_TYPES } = require('../../types')
const Path = require('path');
const { base_path } = require('./api.config');
const { Uploader } = require('../../utils');

// Handlers

const handler404 = async (req, res) => {

    return res.response(RES_TYPES[404]({ message: 'You are lost!' })).code(404);
} 

const handlerUploadPhoto = async (req, res) => {

    console.log("[FUCK]");
    
    const img_name = await Uploader(req.payload?.file)

    if (!img_name) return res.response(RES_TYPES[400]('Gagal mengupload gambar!')).code(400);

    let link = req?.url?.origin + '/images/' + img_name

    return res.response(RES_TYPES[200](link, `Gambar berhasil di upload!`)).code(200);

}

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: '/',
        handler: (h, r) => {
            return r.file(Path.join(__dirname, '../../public/index.html'))
        },
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: '/icons/{param*}',
        handler: {
            directory: {
                path: './icons/',
                redirectToSlash: true,
                index: true,
            }
        },
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: '/images/{param*}',
        handler: {
            directory: {
                path: './images/',
                redirectToSlash: true,
                index: true,
            }
        },
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: '/files/{param*}',
        handler: {
            directory: {
                path: './files/',
                redirectToSlash: true,
                index: true,
            }
        },
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: '/reset-password',
        handler: (h, r) => {
            return r.file(Path.join(__dirname, '../../public/reset-password.html'))
        },
        options: {
            auth: false
        }
    },
    {
        method: [FETCH_REQUEST_TYPES.GET, FETCH_REQUEST_TYPES.POST, FETCH_REQUEST_TYPES.PUT, FETCH_REQUEST_TYPES.DELETE],
        path: '/{any*}',
        handler: handler404,
        options: {
            auth: false
        }
    },

    {
        method: FETCH_REQUEST_TYPES.POST,
        path: base_path + '/upload-photo',
        handler: handlerUploadPhoto,
        options: {
            payload: {
                output: 'stream',
                parse: true,
                multipart: true,
                maxBytes: 3 * 1024 * 1024
            },
            auth: false
        },
    },
]

module.exports = routes