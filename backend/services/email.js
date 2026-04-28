const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://172.21.188.45:3000';

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${APP_BASE_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your NEET Zyme Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A34A; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .button { background: #16A34A; color: white; padding: 15px 30px; 
                   text-decoration: none; border-radius: 8px; display: inline-block; 
                   margin: 20px 0; font-weight: bold; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .token-box { background: #fff; border: 2px dashed #16A34A; padding: 15px; 
                      text-align: center; margin: 15px 0; border-radius: 8px; }
          .token { font-family: monospace; font-size: 16px; color: #16A34A; 
                   word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NEET Zyme</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password.</p>
            <p><strong>Option 1:</strong> Click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p style="margin-top: 20px;"><strong>Option 2:</strong> If the button doesn't work, copy this reset code:</p>
            <div class="token-box">
              <p class="token">${resetToken}</p>
            </div>
            <p>Open the NEET Zyme app, go to Reset Password, and enter the code above.</p>
            <p><strong>This code expires in 30 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>NEET Zyme - Your NEET Preparation Companion</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail };