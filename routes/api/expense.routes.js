const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const { Op } = require('sequelize');
const abs_path = base_path + "/expense"

// Handlers

const handlerSearchExpense = async (req, res) => {

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

        const expenses = await Models.Expense.findAll({
            where: filter,
            offset: (parseInt(page) - 1) * parseInt(per_page),
            limit: parseInt(per_page)
        })

        return res.response(RES_TYPES[200](expenses)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }
}

const handlerGetAllExpenseTags = async (req, res) => {

    try {

        const expenses = await Models.Expense.findAll({
            attributes: ['tag'],
            where: {
                tag: {
                    [Op.ne]: null
                }
            }
        });

        const allTags = expenses.reduce((acc, expense) => {
            return acc.concat(expense.tag)
        }, []);

        const tags = [...new Set(allTags)];
        return res.response(RES_TYPES[200](tags)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetAllExpenses = async (req, res) => {
    
    try {
        const expenses = await Models.Expense.findAll()
        return res.response(RES_TYPES[200](expenses)).code(200);
    } catch (error) {
        return res.response(RES_TYPES[400](error)).code(400);
    }
}

const handlerGetExpense = async (req, res) => {

    const id = req.params.id
    const expense = await Models.Expense.findOne({ where: { id } })

    if (!expense) return res.response(RES_TYPES[400]('Pengeluaran tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200](expense)).code(200);
}

const handlerGetExpenseByStore = async (req, res) => {

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
        filter['created_at'] = {
            [Op.between]: [ start_date, `${end_date} 23:59:59` ]
        }
    }

    if (search_text) {
        filter[Op.or] = [
            { code: { [Op.like]: `%${search_text}%` } },
            { name: { [Op.like]: `%${search_text}%` } },
            { tag: { [Op.like]: `%${search_text}%` } },
        ]
    }

    const totalPages = Math.ceil((await Models.Expense.count({ where: filter })) / parseInt(per_page))

    const expenses = await Models.Expense.findAll({
        where: filter,
        order: [[order_by, order_type?.toUpperCase()]],
        offset: (parseInt(page) - 1) * parseInt(per_page),
        limit: parseInt(per_page)
    })

    if (!expenses) return res.response(RES_TYPES[400]('Pengeluaran tidak ditemukan!')).code(400);

    return res.response(RES_TYPES[200]({
        expenses,
        current_page: parseInt(page),
        total_page: totalPages
    })).code(200);
}

const handlerCreateExpense = async (req, res) => {

    const {
        store_id,
        name,
        tag,
        description,
        nominal,
        date
    } = req.payload || {}

    if (!store_id) return res.response(RES_TYPES[400]('Toko harus diisi!')).code(400);
    if (!name) return res.response(RES_TYPES[400]('Nama harus diisi!')).code(400);
    if (!tag) return res.response(RES_TYPES[400]('Tag harus diisi!')).code(400);
    if (!nominal) return res.response(RES_TYPES[400]('Nominal harus diisi!')).code(400);

    const store = await Models.Store.findOne({ where: { id: store_id } })

    if (!store) return res.response(RES_TYPES[400]('Toko tidak ditemukan!')).code(400);
    if (store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const newExpense = {
        code: `EX${Date.now().toString()}`,
        store_id,
        name,
        tag,
        nominal
    }

    if (date) newExpense['created_at'] = (new Date(date)).toLocaleString('en-CA', { hour12: false }).replace(',', ' ').replace('24:00:00', '00:00:00')

    if (description) newExpense['description'] = description
    
    try {
        const expense = await Models.Expense.create(newExpense)
        return res.response(RES_TYPES[200](expense)).code(200);
    } catch (error) {
        console.log(error)
        return res.response(RES_TYPES[500](error)).code(500);
    }
}

const handlerUpdateExpense = async (req, res) => {

    const id = req.params.id
    const { name, tag, description, nominal, date } = req.payload || {}

    if (!name && !tag && !description && !nominal) return res.response(RES_TYPES[400]('Tidak ada yang diubah!')).code(400);

    const expense = await Models.Expense.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!expense) return res.response(RES_TYPES[400]('Pengeluaran tidak ditemukan!')).code(400);
    if (expense.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    if (name) expense.name = name
    if (tag) expense.tag = tag
    if (description) expense.description = description
    if (nominal) expense.nominal = nominal
    if (date) expense.created_at = date

    try {
        expense.updated_at = (new Date()).toLocaleString('en-CA', { hour12: false }).replace(',', '').replace(' 24:', ' 00:')
        await expense.save()
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }

    return res.response(RES_TYPES[200](expense, `Pengeluaran ${expense.name} berhasil diperbarui`)).code(200);
}

const handlerDeleteExpense = async (req, res) => {

    const id = req.params.id
    const expense = await Models.Expense.findOne({
        where: { id },
        include: [
            {
                model: Models.Store,
                as: 'store'
            }
        ]
    })

    if (!expense) return res.response(RES_TYPES[400]('Pengeluaran tidak ditemukan!')).code(400);
    if (expense.store.owner_id != req.auth.credentials?.user?.id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    try {
        await expense.destroy()
    } catch (error) {
        return res.response(RES_TYPES[500](error.message)).code(500);
    }

    return res.response(RES_TYPES[200](null, `Pengeluaran ${expense.name} telah dihapus`)).code(200);
}

module.exports = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/search',
        handler: handlerSearchExpense
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/tags',
        handler: handlerGetAllExpenseTags
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path,
        handler: handlerGetAllExpenses
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/{id}',
        handler: handlerGetExpense
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + '/store/{id}',
        handler: handlerGetExpenseByStore
    },
    {
        method: FETCH_REQUEST_TYPES.POST,
        path: abs_path,
        handler: handlerCreateExpense
    },
    {
        method: FETCH_REQUEST_TYPES.PUT,
        path: abs_path + '/{id}',
        handler: handlerUpdateExpense
    },
    {
        method: FETCH_REQUEST_TYPES.DELETE,
        path: abs_path + '/{id}',
        handler: handlerDeleteExpense
    }
]