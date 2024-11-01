-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 01, 2024 at 05:09 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_hw`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_devices`
--

CREATE TABLE `tbl_devices` (
  `id` bigint(20) NOT NULL,
  `device_id` text DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `last_sync` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_discounts`
--

CREATE TABLE `tbl_discounts` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `nominal` double DEFAULT NULL,
  `percentage` double DEFAULT NULL,
  `is_percentage` tinyint(1) NOT NULL DEFAULT 0,
  `date_valid` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `multiplication` int(11) NOT NULL DEFAULT 0,
  `max_items_qty` double DEFAULT NULL,
  `min_items_qty` double DEFAULT NULL,
  `special_for_product_id` bigint(20) DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `special_for_variant_id` bigint(20) DEFAULT NULL,
  `special_for_packet_id` bigint(20) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_expenses`
--

CREATE TABLE `tbl_expenses` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `name` text DEFAULT NULL,
  `nominal` double DEFAULT NULL,
  `tag` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_incomes`
--

CREATE TABLE `tbl_incomes` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `name` text DEFAULT NULL,
  `nominal` double DEFAULT NULL,
  `tag` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_incoming_stocks`
--

CREATE TABLE `tbl_incoming_stocks` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `name` text NOT NULL,
  `description` text DEFAULT NULL,
  `status` int(11) DEFAULT 0,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_incoming_stock_items`
--

CREATE TABLE `tbl_incoming_stock_items` (
  `id` bigint(20) NOT NULL,
  `incoming_stock_id` bigint(20) DEFAULT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `variant_id` bigint(20) DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `ingredient_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_ingredients`
--

CREATE TABLE `tbl_ingredients` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `img` text DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `unit_id` bigint(20) DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_ingredient_items`
--

CREATE TABLE `tbl_ingredient_items` (
  `id` bigint(20) NOT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `variant_id` bigint(20) DEFAULT NULL,
  `ingredient_id` bigint(20) DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `unit_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_invoices`
--

CREATE TABLE `tbl_invoices` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `sales_id` bigint(20) DEFAULT NULL,
  `status` double DEFAULT 0,
  `discount` double DEFAULT 0,
  `sub_total` double DEFAULT 0,
  `total` double DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `cash` double DEFAULT 0,
  `change_money` double DEFAULT 0,
  `payment_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_notifications`
--

CREATE TABLE `tbl_notifications` (
  `id` bigint(20) NOT NULL,
  `title` text NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_office_inventories`
--

CREATE TABLE `tbl_office_inventories` (
  `id` bigint(20) NOT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `name` text NOT NULL,
  `price` double DEFAULT NULL,
  `buy_date` datetime DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `goods_condition` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_outgoing_stocks`
--

CREATE TABLE `tbl_outgoing_stocks` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `name` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` int(11) DEFAULT 0,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_outgoing_stock_items`
--

CREATE TABLE `tbl_outgoing_stock_items` (
  `id` bigint(20) NOT NULL,
  `outgoing_stock_id` bigint(20) DEFAULT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `variant_id` bigint(20) DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `ingredient_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_packets`
--

CREATE TABLE `tbl_packets` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `price` double DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_packet_items`
--

CREATE TABLE `tbl_packet_items` (
  `id` bigint(20) NOT NULL,
  `packet_id` bigint(20) DEFAULT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `variant_id` bigint(20) DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payments`
--

CREATE TABLE `tbl_payments` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `account_bank` text DEFAULT NULL,
  `account_number` varchar(50) DEFAULT NULL,
  `receiver_account_bank` text DEFAULT NULL,
  `receiver_account_number` varchar(50) DEFAULT NULL,
  `img` varchar(255) DEFAULT NULL,
  `nominal` double DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payment_types`
--

CREATE TABLE `tbl_payment_types` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_payment_types`
--

INSERT INTO `tbl_payment_types` (`id`, `name`, `description`, `code`, `created_at`, `updated_at`) VALUES
(1, 'Cash', 'Pembayaran Tunai', 'CASH', '2024-06-12 03:36:57', '2024-06-12 03:36:57'),
(2, 'Bank Transfer', 'Pembayaran Transfer Bank', 'BT', '2024-06-12 03:36:57', '2024-06-12 03:36:57');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_products`
--

CREATE TABLE `tbl_products` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `img` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `buy_price` double DEFAULT NULL,
  `price` double DEFAULT NULL,
  `has_variants` tinyint(1) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 0,
  `unit_id` bigint(20) DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sales`
--

CREATE TABLE `tbl_sales` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `status` int(11) DEFAULT 0,
  `total` double DEFAULT 0,
  `discount_id` bigint(20) DEFAULT NULL,
  `payment_type_id` bigint(20) DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `staff_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_sale_items`
--

CREATE TABLE `tbl_sale_items` (
  `id` bigint(20) NOT NULL,
  `sales_id` bigint(20) DEFAULT NULL,
  `qty` double DEFAULT 1,
  `product_id` bigint(20) DEFAULT NULL,
  `variant_id` bigint(20) DEFAULT NULL,
  `packet_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_staffs`
--

CREATE TABLE `tbl_staffs` (
  `id` bigint(20) NOT NULL,
  `code` text DEFAULT NULL,
  `name` text NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_photo` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `date_joined` datetime DEFAULT NULL,
  `status` int(11) DEFAULT 1,
  `salary` double DEFAULT NULL,
  `pos_passcode` varchar(8) DEFAULT NULL,
  `is_cashier` tinyint(1) DEFAULT 0,
  `store_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stores`
--

CREATE TABLE `tbl_stores` (
  `id` bigint(20) NOT NULL,
  `name` text NOT NULL,
  `address` text DEFAULT NULL,
  `store_image` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_sync` datetime DEFAULT NULL,
  `owner_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_units`
--

CREATE TABLE `tbl_units` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `symbol` varchar(50) NOT NULL,
  `base_unit_symbol` varchar(50) NOT NULL,
  `conversion_factor_to_base` double DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_units`
--

INSERT INTO `tbl_units` (`id`, `name`, `symbol`, `base_unit_symbol`, `conversion_factor_to_base`, `created_at`) VALUES
(1, 'Meter', 'm', 'm', 1, '2024-06-11 16:15:07'),
(2, 'Gram', 'g', 'g', 1, '2024-06-11 16:15:07'),
(3, 'Liter', 'l', 'l', 1, '2024-06-11 16:15:07'),
(4, 'Second', 's', 's', 1, '2024-06-11 16:15:07'),
(5, 'Kelvin', 'K', 'K', 1, '2024-06-11 16:15:07'),
(6, 'Piece', 'pcs', 'pcs', 1, '2024-06-11 16:15:07'),
(7, 'Lusin', 'dz', 'pcs', 12, '2024-06-11 16:15:07'),
(8, 'Kilometer', 'km', 'm', 1000, '2024-06-11 16:15:07'),
(9, 'Centimeter', 'cm', 'm', 0.01, '2024-06-11 16:15:07'),
(10, 'Millimeter', 'mm', 'm', 0.001, '2024-06-11 16:15:07'),
(11, 'Micrometer', 'µm', 'm', 0.000001, '2024-06-11 16:15:07'),
(12, 'Nanometer', 'nm', 'm', 0.000000001, '2024-06-11 16:15:07'),
(13, 'Kilogram', 'kg', 'g', 1000, '2024-06-11 16:15:07'),
(14, 'Hectogram', 'hg', 'g', 100, '2024-06-11 16:15:07'),
(15, 'Decagram', 'dag', 'g', 10, '2024-06-11 16:15:07'),
(16, 'Decigram', 'dg', 'g', 0.1, '2024-06-11 16:15:07'),
(17, 'Centigram', 'cg', 'g', 0.01, '2024-06-11 16:15:07'),
(18, 'Milligram', 'mg', 'g', 0.001, '2024-06-11 16:15:07'),
(19, 'Microgram', 'µg', 'g', 0.000001, '2024-06-11 16:15:07'),
(20, 'Nanogram', 'ng', 'g', 0.000000001, '2024-06-11 16:15:07'),
(21, 'Milliliter', 'ml', 'l', 0.001, '2024-06-11 16:15:07'),
(22, 'Centiliter', 'cl', 'l', 0.01, '2024-06-11 16:15:07'),
(23, 'Deciliter', 'dl', 'l', 0.1, '2024-06-11 16:15:07'),
(24, 'Cubic Meter', 'm³', 'l', 1000, '2024-06-11 16:15:07'),
(25, 'Cubic Centimeter', 'cm³', 'l', 0.001, '2024-06-11 16:15:07'),
(26, 'Microliter', 'µl', 'l', 0.000001, '2024-06-11 16:15:07'),
(27, 'Nanoliter', 'nl', 'l', 0.000000001, '2024-06-11 16:15:07'),
(28, 'Minute', 'min', 's', 60, '2024-06-11 16:15:07'),
(29, 'Hour', 'h', 's', 3600, '2024-06-11 16:15:07'),
(30, 'Day', 'd', 's', 86400, '2024-06-11 16:15:07'),
(31, 'Millisecond', 'ms', 's', 0.001, '2024-06-11 16:15:07'),
(32, 'Microsecond', 'µs', 's', 0.000001, '2024-06-11 16:15:07'),
(33, 'Nanosecond', 'ns', 's', 0.000000001, '2024-06-11 16:15:07'),
(34, 'Celsius', '°C', 'K', 1, '2024-06-11 16:15:07'),
(35, 'Fahrenheit', '°F', 'K', 1, '2024-06-11 16:15:07');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `id` bigint(20) NOT NULL,
  `name` text NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password` text NOT NULL,
  `profile_photo` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `privilege` int(11) DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `refresh_token` text DEFAULT NULL,
  `reset_password_token` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_variants`
--

CREATE TABLE `tbl_variants` (
  `id` bigint(20) NOT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `name` text DEFAULT NULL,
  `img` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `buy_price` double DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `price` double DEFAULT NULL,
  `unit_id` bigint(20) DEFAULT NULL,
  `store_id` bigint(20) DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_variant_items`
--

CREATE TABLE `tbl_variant_items` (
  `id` bigint(20) NOT NULL,
  `variant_id` bigint(20) DEFAULT NULL,
  `variant_type_item_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_variant_types`
--

CREATE TABLE `tbl_variant_types` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `product_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_variant_type_items`
--

CREATE TABLE `tbl_variant_type_items` (
  `id` bigint(20) NOT NULL,
  `name` text DEFAULT NULL,
  `variant_type_id` bigint(20) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_devices`
--
ALTER TABLE `tbl_devices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_store_id` (`store_id`);

--
-- Indexes for table `tbl_discounts`
--
ALTER TABLE `tbl_discounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`),
  ADD KEY `special_for_product_id` (`special_for_product_id`),
  ADD KEY `fk_special_for_variant` (`special_for_variant_id`),
  ADD KEY `fk_special_for_packet` (`special_for_packet_id`);

--
-- Indexes for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_incomes`
--
ALTER TABLE `tbl_incomes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_incoming_stocks`
--
ALTER TABLE `tbl_incoming_stocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_incoming_stock_items`
--
ALTER TABLE `tbl_incoming_stock_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `incoming_stock_id` (`incoming_stock_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `fk_incoming_ingredient` (`ingredient_id`);

--
-- Indexes for table `tbl_ingredients`
--
ALTER TABLE `tbl_ingredients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_ingredient_items`
--
ALTER TABLE `tbl_ingredient_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `ingredient_id` (`ingredient_id`),
  ADD KEY `unit_id` (`unit_id`);

--
-- Indexes for table `tbl_invoices`
--
ALTER TABLE `tbl_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `sales_id` (`sales_id`);

--
-- Indexes for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_office_inventories`
--
ALTER TABLE `tbl_office_inventories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_outgoing_stocks`
--
ALTER TABLE `tbl_outgoing_stocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_outgoing_stock_items`
--
ALTER TABLE `tbl_outgoing_stock_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `outgoing_stock_id` (`outgoing_stock_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `fk_outgoing_ingredient` (`ingredient_id`);

--
-- Indexes for table `tbl_packets`
--
ALTER TABLE `tbl_packets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_packet_items`
--
ALTER TABLE `tbl_packet_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `packet_id` (`packet_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`);

--
-- Indexes for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_payment_types`
--
ALTER TABLE `tbl_payment_types`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_products`
--
ALTER TABLE `tbl_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_sales`
--
ALTER TABLE `tbl_sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tbl_sales_staff_id_foreign_idx` (`staff_id`),
  ADD KEY `discount_id` (`discount_id`),
  ADD KEY `payment_type_id` (`payment_type_id`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_sale_items`
--
ALTER TABLE `tbl_sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sales_id` (`sales_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `variant_id` (`variant_id`),
  ADD KEY `packet_id` (`packet_id`);

--
-- Indexes for table `tbl_staffs`
--
ALTER TABLE `tbl_staffs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `store_id` (`store_id`);

--
-- Indexes for table `tbl_stores`
--
ALTER TABLE `tbl_stores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `tbl_units`
--
ALTER TABLE `tbl_units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `tbl_variants`
--
ALTER TABLE `tbl_variants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `unit_id` (`unit_id`),
  ADD KEY `store_id_fk` (`store_id`);

--
-- Indexes for table `tbl_variant_items`
--
ALTER TABLE `tbl_variant_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_variant_id` (`variant_id`),
  ADD KEY `fk_variant_type_item_id` (`variant_type_item_id`);

--
-- Indexes for table `tbl_variant_types`
--
ALTER TABLE `tbl_variant_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_product_id` (`product_id`);

--
-- Indexes for table `tbl_variant_type_items`
--
ALTER TABLE `tbl_variant_type_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_variant_type_id` (`variant_type_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_devices`
--
ALTER TABLE `tbl_devices`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbl_discounts`
--
ALTER TABLE `tbl_discounts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_incomes`
--
ALTER TABLE `tbl_incomes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `tbl_incoming_stocks`
--
ALTER TABLE `tbl_incoming_stocks`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `tbl_incoming_stock_items`
--
ALTER TABLE `tbl_incoming_stock_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `tbl_ingredients`
--
ALTER TABLE `tbl_ingredients`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbl_ingredient_items`
--
ALTER TABLE `tbl_ingredient_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `tbl_invoices`
--
ALTER TABLE `tbl_invoices`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `tbl_office_inventories`
--
ALTER TABLE `tbl_office_inventories`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `tbl_outgoing_stocks`
--
ALTER TABLE `tbl_outgoing_stocks`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tbl_outgoing_stock_items`
--
ALTER TABLE `tbl_outgoing_stock_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tbl_packets`
--
ALTER TABLE `tbl_packets`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tbl_packet_items`
--
ALTER TABLE `tbl_packet_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbl_payment_types`
--
ALTER TABLE `tbl_payment_types`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_products`
--
ALTER TABLE `tbl_products`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `tbl_sales`
--
ALTER TABLE `tbl_sales`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `tbl_sale_items`
--
ALTER TABLE `tbl_sale_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `tbl_staffs`
--
ALTER TABLE `tbl_staffs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `tbl_stores`
--
ALTER TABLE `tbl_stores`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_units`
--
ALTER TABLE `tbl_units`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_variants`
--
ALTER TABLE `tbl_variants`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `tbl_variant_items`
--
ALTER TABLE `tbl_variant_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `tbl_variant_types`
--
ALTER TABLE `tbl_variant_types`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `tbl_variant_type_items`
--
ALTER TABLE `tbl_variant_type_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=192;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_devices`
--
ALTER TABLE `tbl_devices`
  ADD CONSTRAINT `fk_store_id` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`);

--
-- Constraints for table `tbl_discounts`
--
ALTER TABLE `tbl_discounts`
  ADD CONSTRAINT `fk_special_for_packet` FOREIGN KEY (`special_for_packet_id`) REFERENCES `tbl_packets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_special_for_variant` FOREIGN KEY (`special_for_variant_id`) REFERENCES `tbl_variants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_discounts_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`),
  ADD CONSTRAINT `tbl_discounts_ibfk_3` FOREIGN KEY (`special_for_product_id`) REFERENCES `tbl_products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_expenses`
--
ALTER TABLE `tbl_expenses`
  ADD CONSTRAINT `tbl_expenses_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_incomes`
--
ALTER TABLE `tbl_incomes`
  ADD CONSTRAINT `tbl_incomes_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_incoming_stocks`
--
ALTER TABLE `tbl_incoming_stocks`
  ADD CONSTRAINT `tbl_incoming_stocks_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_incoming_stock_items`
--
ALTER TABLE `tbl_incoming_stock_items`
  ADD CONSTRAINT `fk_incoming_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `tbl_ingredients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_incoming_stock_items_ibfk_4` FOREIGN KEY (`incoming_stock_id`) REFERENCES `tbl_incoming_stocks` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_incoming_stock_items_ibfk_5` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_incoming_stock_items_ibfk_6` FOREIGN KEY (`variant_id`) REFERENCES `tbl_variants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_ingredients`
--
ALTER TABLE `tbl_ingredients`
  ADD CONSTRAINT `tbl_ingredients_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `tbl_units` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_ingredients_ibfk_4` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_ingredient_items`
--
ALTER TABLE `tbl_ingredient_items`
  ADD CONSTRAINT `tbl_ingredient_items_ibfk_6` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_ingredient_items_ibfk_7` FOREIGN KEY (`variant_id`) REFERENCES `tbl_variants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_ingredient_items_ibfk_8` FOREIGN KEY (`ingredient_id`) REFERENCES `tbl_ingredients` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_ingredient_items_ibfk_9` FOREIGN KEY (`unit_id`) REFERENCES `tbl_units` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_invoices`
--
ALTER TABLE `tbl_invoices`
  ADD CONSTRAINT `tbl_invoices_ibfk_1` FOREIGN KEY (`sales_id`) REFERENCES `tbl_sales` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_invoices_ibfk_2` FOREIGN KEY (`payment_id`) REFERENCES `tbl_payments` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_notifications`
--
ALTER TABLE `tbl_notifications`
  ADD CONSTRAINT `tbl_notifications_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_office_inventories`
--
ALTER TABLE `tbl_office_inventories`
  ADD CONSTRAINT `tbl_office_inventories_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_outgoing_stocks`
--
ALTER TABLE `tbl_outgoing_stocks`
  ADD CONSTRAINT `tbl_outgoing_stocks_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_outgoing_stock_items`
--
ALTER TABLE `tbl_outgoing_stock_items`
  ADD CONSTRAINT `fk_outgoing_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `tbl_ingredients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_outgoing_stock_items_ibfk_4` FOREIGN KEY (`outgoing_stock_id`) REFERENCES `tbl_outgoing_stocks` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_outgoing_stock_items_ibfk_5` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_outgoing_stock_items_ibfk_6` FOREIGN KEY (`variant_id`) REFERENCES `tbl_variants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_packets`
--
ALTER TABLE `tbl_packets`
  ADD CONSTRAINT `tbl_packets_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_packet_items`
--
ALTER TABLE `tbl_packet_items`
  ADD CONSTRAINT `tbl_packet_items_ibfk_4` FOREIGN KEY (`packet_id`) REFERENCES `tbl_packets` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_packet_items_ibfk_5` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_packet_items_ibfk_6` FOREIGN KEY (`variant_id`) REFERENCES `tbl_variants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_products`
--
ALTER TABLE `tbl_products`
  ADD CONSTRAINT `tbl_products_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `tbl_units` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_products_ibfk_4` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_sales`
--
ALTER TABLE `tbl_sales`
  ADD CONSTRAINT `tbl_sales_ibfk_4` FOREIGN KEY (`discount_id`) REFERENCES `tbl_discounts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_sales_ibfk_5` FOREIGN KEY (`payment_type_id`) REFERENCES `tbl_payment_types` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_sales_ibfk_6` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_sales_staff_id_foreign_idx` FOREIGN KEY (`staff_id`) REFERENCES `tbl_staffs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_sale_items`
--
ALTER TABLE `tbl_sale_items`
  ADD CONSTRAINT `tbl_sale_items_ibfk_5` FOREIGN KEY (`sales_id`) REFERENCES `tbl_sales` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_sale_items_ibfk_6` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_sale_items_ibfk_7` FOREIGN KEY (`variant_id`) REFERENCES `tbl_variants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_sale_items_ibfk_8` FOREIGN KEY (`packet_id`) REFERENCES `tbl_packets` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_staffs`
--
ALTER TABLE `tbl_staffs`
  ADD CONSTRAINT `tbl_staffs_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_stores`
--
ALTER TABLE `tbl_stores`
  ADD CONSTRAINT `tbl_stores_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `tbl_users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_variants`
--
ALTER TABLE `tbl_variants`
  ADD CONSTRAINT `store_id_fk` FOREIGN KEY (`store_id`) REFERENCES `tbl_stores` (`id`),
  ADD CONSTRAINT `tbl_variants_ibfk_3` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_variants_ibfk_4` FOREIGN KEY (`unit_id`) REFERENCES `tbl_units` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tbl_variant_items`
--
ALTER TABLE `tbl_variant_items`
  ADD CONSTRAINT `fk_variant_id` FOREIGN KEY (`variant_id`) REFERENCES `tbl_variants` (`id`),
  ADD CONSTRAINT `fk_variant_type_item_id` FOREIGN KEY (`variant_type_item_id`) REFERENCES `tbl_variant_type_items` (`id`);

--
-- Constraints for table `tbl_variant_types`
--
ALTER TABLE `tbl_variant_types`
  ADD CONSTRAINT `fk_product_id` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`id`);

--
-- Constraints for table `tbl_variant_type_items`
--
ALTER TABLE `tbl_variant_type_items`
  ADD CONSTRAINT `fk_variant_type_id` FOREIGN KEY (`variant_type_id`) REFERENCES `tbl_variant_types` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
