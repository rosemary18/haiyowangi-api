const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const abs_path = base_path + "/payment"

// Handlers

const handlerGetPaymentTypes = async (req, res) => {

    const paymentTypes = await Models.PaymentType.findAll()
    return res.response(RES_TYPES[200](paymentTypes)).code(200);
}

const handlerGetPaymentType = async (req, res) => {

    const id = req.params.id
    const paymentType = await Models.PaymentType.findOne({ where: { id } })

    if (!paymentType) return res.response(RES_TYPES[404]("Payment type not found")).code(404);

    return res.response(RES_TYPES[200](paymentType?.toJSON())).code(200);
}

const handlerGetAllPayments = async (req, res) => {

    const payments = await Models.Payment.findAll()
    return res.response(RES_TYPES[200](payments)).code(200);
}

const handlerGetAllPayment = async (req, res) => {

    const id = req.params.id
    const payment = await Models.Payment.findOne({ where: { id } })

    if (!payment) return res.response(RES_TYPES[404]("Payment not found")).code(404);

    return res.response(RES_TYPES[200](payment?.toJSON())).code(200);
}

// Routing

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/types',
        handler: handlerGetPaymentTypes,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/types/{id}',
        handler: handlerGetPaymentType,
        options: {
            auth: false
        }
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllPayments
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetAllPayment
    },

]

module.exports = routes