const Models = require('../../models')
const { base_path } = require('./api.config');
const { RES_TYPES, FETCH_REQUEST_TYPES } = require('../../types');
const Path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const { Op } = require('sequelize');
const { options } = require('joi');
const abs_path = base_path + "/insight"

// Handlers

const handlerGetInsight = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({where: { id }})
    
    if (!store) return res.response(RES_TYPES[404]("Toko tidak ditemukan!")).code(404);
    if (req.auth.credentials?.user?.id != store?.owner_id) return res.response(RES_TYPES[400]('Anda tidak punya akses!')).code(400);

    const {
        date 
    } = req.query

    if (!date) return res.response(RES_TYPES[400]('Lengkapi waktu pencarian insight!')).code(400);

    const dateObj = new Date(date)
    const startDateOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1, 0, 0, 1)
    const endDateOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);

    const filter = {
        store_id: id
    }

    filter['created_at'] = {
        [Op.between]: [ 
            `${startDateOfMonth.toLocaleString('en-CA', { hour12: false }).replace(',', ' ').split(' ')[0]} 00:00:00`, 
            `${endDateOfMonth.toLocaleString('en-CA', { hour12: false }).replace(',', ' ').split(' ')[0]} 23:59:59` 
        ]
    }
    
    const sales = await Models.Sale.findAll({
        where: {
            ...filter,
            status: 1
        },
    })

    const incomes = await Models.Income.findAll({
        where: filter
    })

    const expenses = await Models.Expense.findAll({
        where: filter
    })
    
    const nominalSales = sales.reduce((a, b) => a + b.total, 0)
    const nominalIncomes = incomes.reduce((a, b) => a + b.nominal, 0)
    const nominalExpenses = expenses.reduce((a, b) => a + b.nominal, 0)

    const incomeSources = {}
    const expenseSources = {}

    for (const income of incomes) {
        if (Object.keys(incomeSources).includes(income.tag)) {
            incomeSources[income.tag] += income.nominal
        } else {
            incomeSources[income.tag] = income.nominal
        }
    }

    for (const expense of expenses) {
        if (Object.keys(expenseSources).includes(expense.tag)) {
            expenseSources[expense.tag] += expense.nominal
        } else {
            expenseSources[expense.tag] = expense.nominal
        }
    }

    const resData = {
        sales: {
            total: sales.length,
            nominal: sales.reduce((a, b) => a + b.total, 0)
        },
        incomes: {
            sources: Object.keys(incomeSources).map(k => ({ name: k, value: incomeSources[k] })),
            total: nominalIncomes+nominalSales
        },
        expenses: {
            sources: Object.keys(expenseSources).map(k => ({ name: k, value: expenseSources[k] })),
            total: nominalExpenses
        },
        laba: (nominalIncomes+nominalSales)-nominalExpenses
    }

    return res.response(RES_TYPES[200](resData)).code(200);
}

const handlerExportInsight = async (req, res) => {

    const id = req.params.id
    const store = await Models.Store.findOne({where: { id }})
    
    if (!store) return res.response(RES_TYPES[404]("Toko tidak ditemukan!")).code(404);

    const {
        date 
    } = req.query

    if (!date) return res.response(RES_TYPES[400]('Lengkapi waktu pencarian insight!')).code(400);

    const dateObj = new Date(date)
    const startDateOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1, 0, 0, 1)
    const endDateOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);

    const filter = {
        store_id: id
    }

    filter['created_at'] = {
        [Op.between]: [ 
            `${startDateOfMonth.toLocaleString('en-CA', { hour12: false }).replace(',', ' ').split(' ')[0]} 00:00:00`, 
            `${endDateOfMonth.toLocaleString('en-CA', { hour12: false }).replace(',', ' ').split(' ')[0]} 23:59:59` 
        ]
    }
    
    const sales = await Models.Sale.findAll({
        where: {
            ...filter,
            status: 1
        },
    })

    const incomes = await Models.Income.findAll({
        where: filter
    })

    const expenses = await Models.Expense.findAll({
        where: filter
    })

    const workbook = XLSX.utils.book_new();
    const worksheet1 = XLSX.utils.json_to_sheet(JSON.parse(JSON.stringify(sales)));
    const worksheet2 = XLSX.utils.json_to_sheet(JSON.parse(JSON.stringify(incomes)));
    const worksheet3 = XLSX.utils.json_to_sheet(JSON.parse(JSON.stringify(expenses)));
    XLSX.utils.book_append_sheet(workbook, worksheet1, `${store.name}: Penjualan`);
    XLSX.utils.book_append_sheet(workbook, worksheet2, `${store.name}: Pendapatan`);
    XLSX.utils.book_append_sheet(workbook, worksheet3, `${store.name}: Pengeluaran`);

    const filename = `${store.id}-insight-${dateObj.getFullYear()}-${dateObj.getMonth()+1}.xlsx`;
    const filePath = `./public/files/${filename}`;
    XLSX.writeFile(workbook, filePath);

    return res.file(Path.join(__dirname, `../../public/files/${filename}`), {
        filename: filePath,
        mode: 'attachment'
    });
    
}

// Routes

const routes = [
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/store/{id}",
        handler: handlerGetInsight
    },
    {
        method: FETCH_REQUEST_TYPES.GET,
        path: abs_path + "/export/store/{id}",
        handler: handlerExportInsight,
        options: {
            auth: false
        }
    }
]

module.exports = routes