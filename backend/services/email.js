const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const APP_SCHEME = 'myapp';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8081';

const sendPasswordResetEmail = async (email, resetToken) => {
  const deepLinkUrl = `${APP_SCHEME}://reset-password?token=${resetToken}`;

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
          .container { max-width: 600px; margin: 0 auto; padding: 20px }
          .header { background: #16A34A; color: white; padding: 20px; text-align: center }
          .content { padding: 30px 20px; background: #f9f9f9 }
          .button { background: #16A34A; color: white; padding: 15px 30px; 
                   text-decoration: none; border-radius: 8px; display: inline-block; 
                   margin: 20px 0; font-weight: bold; font-size: 18px }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666 }
          .token-box { background: #fff; border: 2px dashed #16A34A; padding: 20px; 
                      text-align: center; margin: 15px 0; border-radius: 8px }
          .token { font-family: monospace; font-size: 18px; color: #16A34A; 
                   word-break: break-all; font-weight: bold; letter-spacing: 1px }
          .label { font-size: 14px; color: #666; margin-bottom: 10px; font-weight: bold }
          .or-divider { text-align: center; margin: 20px 0; color: #666 }
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
            
            <center>
            <a href="${deepLinkUrl}" class="button">Open NEET Zyme App</a>
            </center>
            
            <p class="or-divider">- OR -</p>
            
            <p>Copy this reset code manually:</p>
            
            <p class="label">YOUR RESET CODE:</p>
            <div class="token-box">
              <p class="token">${resetToken}</p>
            </div>
            
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

const sendVerificationEmail = async (email, verificationToken) => {
  const deepLinkUrl = `${APP_SCHEME}://verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your NEET Zyme account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px }
          .header { background: #16A34A; color: white; padding: 20px; text-align: center }
          .content { padding: 30px 20px; background: #f9f9f9; text-align: center }
          .button { background: #16A34A; color: white; padding: 15px 30px; 
                   text-decoration: none; border-radius: 8px; display: inline-block; 
                   margin: 20px 0; font-weight: bold; font-size: 18px }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666 }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NEET Zyme</h1>
          </div>
          <div class="content">
            <h2>Welcome to NEET Zyme!</h2>
            <p>Click below to verify your email address and activate your account.</p>
            <center>
            <a href="${deepLinkUrl}" class="button">Verify Email</a>
            </center>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Or copy this link into your browser:<br>
              <span style="color: #16A34A;">${deepLinkUrl}</span>
            </p>
            <p style="margin-top: 30px; color: #999; font-size: 13px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
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

module.exports = { sendPasswordResetEmail, sendVerificationEmail };