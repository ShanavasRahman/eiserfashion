const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
auth: {
    user: 'shanavas11222@gmail.com',
    pass:'edhi exql ovsk aehm',
},
});


module.exports = transporter;