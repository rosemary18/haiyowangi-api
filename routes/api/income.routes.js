const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/income"

// Handlers
const handlerSearchIncome = async (req, res) => {

    try {

        const {
            search_text,
            store_id,
            page = 1,
            per_page = 15
        } = req.query

        if (!store_id) return res.response(RES_TYPES[400]('Mohon lengkapi data terlebih dahulu!')).code(400);

        const store = await Models.Store.findOne({ where: { id: store_id } })
        if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
        if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

        if (!search_text) return res.response(RES_TYPES[200]([])).code(200);

        const filter = {
            store_id,
            [Op.or]: [
                { code: { [Op.like]: `%${search_text}%` } },
                { name: { [Op.like]: `%${search_text}%` } },
                { tag: { [Op.like]: `%${search_text}%` } },
            ]
        }

        const incomes = await Models.Income.findAll({
            where: filter,
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](incomes)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetAllIncomeTags = async (req, res) => {

    try {

        const incomes = await Models.Income.findAll({
            attributes: ['tag'],
            where: {
                tag: {
                    [Op.ne]: null
                }
            }
        });

        const allTags = incomes.reduce((acc, income) => {
            return acc.concat(income.tag)
        }, []);

        const tags = [...new Set(allTags)];
        return res.response(RES_TYPES[200](tags)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetAllIncomes = async (req, res) => {
    
    try {
        const incomes = await Models.Income.findAll({
            order: [['created_at', 'DESC']]
        })
        return res.response(RES_TYPES[200](incomes)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetIncome = async (req, res) => {

    const id = req.params.id
    const income = await Models.Income.findOne({ where: { id } })

    if (!income) return res.response(RES_TYPES[400]('Pendapatan tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](income)).code(200);
}

const handlerGetIncomeByStore = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({ where: { id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const {
        search_text,
        tag,
        page = 1,
        per_page = 15,
        start_date = null,
        end_date = null,
        order_by = 'id',
        order_type = 'DESC'
    } = req.query

    const filter = { store_id: id }
    if (tag) filter['tag'] = tag

    if (start_date || end_date) {
        filter['created_at'] = {}
        if (start_date) filter['created_at'][Op.gte] = start_date
        if (end_date) filter['created_at'][Op.lte] = end_date
    }

    if (search_text) {
        filter[Op.or] = [
            { code: { [Op.like]: `%${search_text}%` } },
            { name: { [Op.like]: `%${search_text}%` } },
            { tag: { [Op.like]: `%${search_text}%` } },
        ]
    }

    const incomes = await Models.Income.findAll({
        where: filter,
        order: [[order_by, order_type?.toUpperCase()]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!incomes) return res.response(RES_TYPES[400]('Pendapatan tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](incomes)).code(200);
}

const handlerCreateIncome = async (req, res) => {

    const {
        store_id,
        name,
        tag,
        description,
        nominal
    } = req.payload || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);
    if (!name) return res.response(RES_TYPES[400]('Nama harus diisi!')).code(400);
    if (!tag) return res.response(RES_TYPES[400]('Tag harus diisi!')).code(400);
    if (!nominal) return res.response(RES_TYPES[400]('Nominal harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newIncome = {
        code: `IN${Date.now().toString()}`,
        store_id,
        name,
        tag,
        nominal
    }

    if (description) newIncome['description'] = description

    const income = await Models.Income.create(newIncome)

    if (!income) return res.response(RES_TYPES[400]('Pendapatan gagal dibuat!')).code(400);

    return res.response(RES_TYPES[200](income)).code(200);
}

const handlerUpdateIncome = async (req, res) => {

    const id = req.params.id
    const {
        name,
        tag,
        description,
        nominal
    } = req.payload || {}

    if (!name && !tag && !description && !nominal) return res.response(RES_TYPES[400]('Tidak ada data yang diubah!')).code(400);

    const income = await Models.Income.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store',
            }
        ]
    })

    if (!income) return res.response(RES_TYPES[400]('Pendapatan tidak ditemukan!')).code(400);
    if (income.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name) income.name = name
    if (tag) income.tag = tag
    if (description) income.description = description
    if (nominal) income.nominal = nominal

    try {
        income.updated_at = new Date()
        await income.save()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400]('Pendapatan gagal diubah!')).code(400);
    }

    return res.response(RES_TYPES[200](income, `Pendapatan ${income.name} telah diubah`)).code(200);
}

const handlerDeleteIncome = async (req, res) => {

    const id = req.params.id
    const income = await Models.Income.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store',
            }
        ]
    })

    if (!income) return res.response(RES_TYPES[400]('Pendapatan tidak ditemukan!')).code(400);
    if (income.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        await income.destroy()
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[400]('Pendapatan gagal dihapus!')).code(400);
    }

    return res.response(RES_TYPES[200](null, `Pendapatan ${income.name} telah dihapus`)).code(200);
}

module.exports = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchIncome
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/tags',
        handler: handlerGetAllIncomeTags
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllIncomes
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetIncome
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetIncomeByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateIncome
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateIncome
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteIncome
    },
]