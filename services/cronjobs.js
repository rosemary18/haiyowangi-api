const cron = require('node-cron');
const Models = require('../models');

module.exports = async (app) => {

    // Check product qty
    cron.schedule('0 6,0 * * *', async () => {
        
        // Running a job at 06:00 AM and 12:00 AM every da

        const warningProducts = Models.Product.findAll({
            where: {
                is_published: true,
                qty: {
                    [Op.lt]: 5
                }
            },
        })

        const warningVariants = Models.Variant.findAll({
            where: {
                is_published: true,
                qty: {
                    [Op.lt]: 5
                }
            },
        })

        if (warningProducts.length > 0) {
            for (const item of warningProducts) {
                const newNotification = {
                    title: "Peringatan Stok Produk!",
                    message: `Stok  produk${item.name} tersisa ${item.qty} lagi.`,
                    store_id: item.store_id,
                }
                await Models.Notification.create(newNotification);
            }
        }

        if (warningVariants.length > 0) {
            for (const item of warningVariants) {
                const newNotification = {
                    title: "Peringatan Stok Varian!",
                    message: `Stok  varian${item.name} tersisa ${item.qty} lagi.`,
                    store_id: item.store_id,
                }
                await Models.Notification.create(newNotification);
            }
        }

    });
};