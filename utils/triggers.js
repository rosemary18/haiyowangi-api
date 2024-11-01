const { Op } = require('sequelize');
const Models = require('../models');
const sids = []

const ingredientTriggers = async (_ids = [], store_id) => {

    const ids = [...new Set(_ids)]

    try {
        if (store_id && ids.length > 0) {
            const ingredients = await Models.Ingredient.findAll({
                where: { id: { [Op.in]: ids } },
                include: [
                    {
                        model: Models.Unit,
                        as: 'uom'
                    },
                    {
                        model: Models.IngredientItem,
                        as: 'ingredients',
                        include: [
                            {
                                model: Models.Product,
                                as: 'product',
                                include: [
                                    {
                                        model: Models.IngredientItem,
                                        as: 'ingredients',
                                        include: [
                                            {
                                                model: Models.Ingredient,
                                                as: 'ingredient',
                                                include: {
                                                    model: Models.Unit,
                                                    as: 'uom'
                                                }
                                            },
                                            {
                                                model: Models.Unit,
                                                as: 'uom'
                                            }
                                        ]
                                    },
                                ]
                            },
                            {
                                model: Models.Variant,
                                as: 'variant',
                                include: [
                                    {
                                        model: Models.IngredientItem,
                                        as: 'ingredients',
                                        include: [
                                            {
                                                model: Models.Ingredient,
                                                as: 'ingredient',
                                                include: {
                                                    model: Models.Unit,
                                                    as: 'uom'
                                                }
                                            },
                                            {
                                                model: Models.Unit,
                                                as: 'uom'
                                            }
                                        ]
                                    },
                                ]
                            }
                        ]
                    }
                ]
            })
            console.log(JSON.stringify(ingredients))
            if (ingredients.length > 0) {
                ingredients.forEach(async ingredient => {
                    if (ingredient.ingredients.length > 0) {
                        ingredient.ingredients.forEach(async ingredient_item => {
                            if (ingredient_item.product && ingredient_item.product?.ingredients?.length > 0) {
                                let qty = 0
                                const div = []
                                ingredient_item.product.ingredients.forEach(product_ingredient_item => {
                                    let _div = product_ingredient_item.ingredient.qty/product_ingredient_item.qty
                                    div.push(_div)
                                })
                                qty = Math.floor(Math.min(...div))
                                ingredient_item.product.qty = qty
                                await ingredient_item.product.save()
                            } else if (ingredient_item.variant && ingredient_item?.variant.ingredients?.length > 0) {
                                let qty = 0
                                const div = []
                                ingredient_item.variant.ingredients.forEach(variant_ingredient_item => {
                                    let _div = variant_ingredient_item.ingredient.qty/variant_ingredient_item.qty
                                    div.push(_div)
                                })
                                qty = Math.floor(Math.min(...div))
                                ingredient_item.variant.qty = qty
                                await ingredient_item.variant.save()
                            }
                        })
                    }
                })
            }
        }
    } catch(error) {
        console.log(error)
    }
}

module.exports = {
    ingredientTriggers
}