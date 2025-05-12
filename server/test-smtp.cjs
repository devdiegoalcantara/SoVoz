require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: process.env.SMTP_USER,
  to: process.env.SMTP_USER, // envia para si mesmo
  subject: 'Teste SMTP SoVoz',
  text: 'Funcionou! Este é um teste de SMTP do SoVoz.'
}, (err, info) => {
  if (err) {
    console.error('Erro ao enviar email:', err);
  } else {
    console.log('Email enviado com sucesso:', info.response);
  }
}); 