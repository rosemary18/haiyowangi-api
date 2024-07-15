const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const abs_path = base_path + "/uom"

// Handlers

const handlerGetUnits = async (req, res) => {

    const units = await Models.Unit.findAll()
    return res.response(RES_TYPES[200](units)).code(200);
}

const handlerGetUnit = async (req, res) => {

    const id = req.params.id
    const unit = await Models.Unit.findOne({ where: { id } })

    if (!unit) return res.response(RES_TYPES[404]("Unit not found")).code(404);
    
    return res.response(RES_TYPES[200](unit)).code(200);
}

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetUnits,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetUnit,
        options: {
            auth: false
        }
    },
]

module.exports = routes