const Path = require('path');
const fs = require('fs');

module.exports = async (file, isFile) => {

    if (!file) return null;

    const uniqueSuffix = `${Date.now()}${Math.round(Math.random() * 1E9)}${Path.extname(file.hapi.filename)}`;
    const filePath = Path.join(__dirname, `../public/${isFile ? 'files' : 'images'}`, uniqueSuffix);
    const fileStream = fs.createWriteStream(filePath);
    return await new Promise((resolve, reject) => {
        file.pipe(fileStream);
        file.on('end', () => resolve(uniqueSuffix));
        file.on('error', reject);
    });
}