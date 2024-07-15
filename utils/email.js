const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'mail.haiyowangi.com',
    port: 465,
    secure: true,
    auth: {
        user: 'no-reply@haiyowangi.com',
        pass: 'k4t4s4nd118'
    }
});

// Fungsi untuk mengirim email
async function sendEmail(to, subject, text, html) {
    try {
        const info = await transporter.sendMail({
            from: 'Haiyo Wangi Parfume <no-reply@haiyowangi.com>',
            to, 
            subject,
            text,
            html
        });
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email: %s', error);
    }
}

module.exports = { sendEmail }