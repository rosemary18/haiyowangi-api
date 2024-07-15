const { FETCH_REQUEST_TYPES, RES_TYPES } = require('../../types')
const Path = require('path')

// Handlers

const handler404 = async (req, res) => {

    return res.response(RES_TYPES[404]({ message: 'You are lost!' })).code(404);
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
    }
]

module.exports = routes