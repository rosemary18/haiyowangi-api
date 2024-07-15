const PacketItem = require("./packet_item.model");
const Discount = require("./discount.model");
const Expense = require("./expense.model");
const Income = require("./income.model");
const IncomingStock = require("./incoming_stock.model");
const IncomingStockItem = require("./incoming_stock_item.model");
const Ingredient = require("./ingredient.model");
const IngredientItem = require("./ingredient_item.model");
const Invoice = require("./invoice.model");
const Notification = require("./notification.model");
const OfficeInventory = require("./office_inventory.model");
const OutgoingStock = require("./outgoing_stock.model");
const OutgoingStockItem = require("./outgoing_stock_item.model");
const Packet = require("./packet.model");
const Payment = require("./payment.model");
const PaymentType = require("./payment_type.model");
const Product = require("./product.model");
const Sale = require("./sale.model");
const SaleItem = require("./sale_item.model");
const Staff = require("./staff.model");
const Store = require("./store.model");
const Unit = require("./unit.model");
const User = require("./user.model");
const Variant = require("./variant.model");
const VariantItem = require("./variant_item.model");
const VariantType = require("./variant_type.model");
const VariantTypeItem = require("./variant_type_item.model");
const Device = require("./device.model");

// Relations
Ingredient.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });
Store.hasMany(Ingredient, { foreignKey: 'store_id', as: 'ingredients' });
PacketItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(PacketItem, { foreignKey: 'product_id', as: 'packet_items' });
PacketItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });
Variant.hasMany(PacketItem, { foreignKey: 'variant_id', as: 'packet_items' });
OutgoingStockItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(OutgoingStockItem, { foreignKey: 'product_id', as: 'outgoing_stock_items' });
OutgoingStockItem.belongsTo(Variant, { foreignKey: 'variant_id', as: 'variant' });
Variant.hasMany(OutgoingStockItem, { foreignKey: 'variant_id', as: 'outgoing_stock_items' });

Product.hasMany(Discount, { foreignKey: 'special_for_product_id', as: 'discounts' });
Variant.hasMany(Discount, { foreignKey: 'special_for_variant_id', as: 'discounts' });
Packet.hasMany(Discount, { foreignKey: 'special_for_packet_id', as: 'discounts' });
Discount.belongsTo(Product, { foreignKey: 'special_for_product_id', as: 'product' });
Discount.belongsTo(Variant, { foreignKey: 'special_for_variant_id', as: 'variant' });
Discount.belongsTo(Packet, { foreignKey: 'special_for_packet_id', as: 'packet' });

Ingredient.hasMany(IngredientItem, { foreignKey: 'ingredient_id', as: 'ingredients' });
IngredientItem.belongsTo(Ingredient, { foreignKey: 'ingredient_id', as: 'ingredient' });

module.exports = {
    PacketItem,
    Discount,
    Expense,
    Income,
    IncomingStock,
    IncomingStockItem,
    Ingredient,
    IngredientItem,
    Invoice,
    Notification,
    OfficeInventory,
    OutgoingStock,
    OutgoingStockItem,
    Packet,
    Payment,
    PaymentType,
    Product,
    SaleItem,
    Sale,
    Staff,
    Store,
    Device,
    Unit,
    User,
    Variant,
    VariantItem,
    VariantType,
    VariantTypeItem
}