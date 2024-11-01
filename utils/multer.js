const multer = require('multer');
const path = require('path');
const fs = require('fs');

const imgDir = path.join(__dirname, '../public/images');
const fileDir = path.join(__dirname, '../public/files');

if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir, { recursive: true });

const imageFileFilter = (req, file, cb) => {
    const supportedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (supportedMimeTypes.includes(file.mimetype)) cb(null, true);
    else cb(null, false);
};

// Konfigurasi Storage Gambar
const imgStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imgDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}${Math.round(Math.random() * 1E9)}`;
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Konfigurasi Storage File
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fileDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const ImageUploader = multer({ storage: imgStorage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: imageFileFilter });
const FileUploader = multer({ storage: fileStorage, limits: { fileSize: 3 * 1024 * 1024 } });

module.exports = {
    ImageUploader,
    FileUploader
}