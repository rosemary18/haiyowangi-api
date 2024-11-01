const { generateQr, generateRandomString } = require('./qr');
const generateQueueImage = require('./queue-image');
const createPDF = require('./pdf')
const { sendEmail } = require('./email')
const { FileUploader, ImageUploader } = require('./multer');
const Uploader = require('./uploader');

module.exports = {
    generateQr,
    generateRandomString,
    generateQueueImage,
    createPDF,
    sendEmail,
    ImageUploader,
    FileUploader,
    Uploader,
    ...require("./triggers")
}