const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const abs_path = base_path + "/invoice"

// Handlers

const handlerGetAllInvoices = async (req, res) => {

    try {
        const invoices = await Models.Invoice.findAll({
            include: [
                {
                    model: Models.Sale,
                    as: 'sale',
                    include: [
                        {
                            model: Models.SaleItem,
                            as: 'items'
                        }
                    ]
                },
                {
                    model: Models.Payment,
                    as: 'payment'
                }
            ]
        })
        return res.response(RES_TYPES[200](invoices)).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetInvoice = async (req, res) => {

    const id = req.params.id
    const invoice = await Models.Invoice.findOne({
        where: { id },
        include: [
            {
                model: Models.Sale,
                as: 'sale',
                include: [
                    {
                        model: Models.SaleItem,
                        as: 'items'
                    }
                ]
            },
            {
                model: Models.Payment,
                as: 'payment'
            }
        ]
    })

    if (!invoice) return res.response(RES_TYPES[404]("Faktur tidak ditemukan")).code(404);

    return res.response(RES_TYPES[200](invoice)).code(200);
}

module.exports = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllInvoices
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/{id}",
        handler: handlerGetInvoice
    }
]