const { generateQr, generateRandomString } = require('./qr');
const generateQueueImage = require('./queue-image');
const createPDF = require('./pdf')
const { sendEmail } = require('./email')
const { ImageUploader, FileUploader } = require('./multer');

module.exports = {
    generateQr,
    generateRandomString,
    generateQueueImage,
    createPDF,
    sendEmail,
    ImageUploader,
    FileUploader
}