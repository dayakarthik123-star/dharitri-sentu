import nodemailer from 'nodemailer';

let transporter = null;

export function getEmailTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const mailer = getEmailTransporter();
  if (!mailer) {
    throw new Error('SMTP transporter is not configured.');
  }

  const from = process.env.MAIL_FROM || `"Dharitri Sentu" <${process.env.SMTP_USER}>`;

  const info = await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log(`[Email] Message sent to ${to} (ID: ${info.messageId})`);
  return { ok: true, messageId: info.messageId };
}

export async function sendPasswordResetEmail(toEmail, resetToken, userName = 'User') {
  const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const subject = 'Reset Your Dharitri Sentu Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5EC; margin: 0; padding: 20px; color: #172E29; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; border: 1px solid #DFD6C3; box-shadow: 0 4px 18px rgba(10,36,27,0.04); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: bold; color: #0A241B; letter-spacing: -0.5px; }
        .tagline { font-size: 10px; color: #426B42; font-weight: bold; letter-spacing: 2px; }
        .button { display: inline-block; background-color: #0A241B; color: #F8FAF7 !important; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; margin: 24px 0; }
        .footer { font-size: 11px; color: #738077; border-top: 1px solid #EBE5D8; margin-top: 32px; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Dharitri Sentu</div>
          <div class="tagline">LAND · EVIDENCE · TRUST</div>
        </div>
        <h2>Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset the password for your Dharitri Sentu account.</p>
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button" target="_blank">Reset Password →</a>
        </div>
        <p style="font-size: 12px; color: #526057;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 11px; word-break: break-all; color: #426B42; background: #F8F5EC; padding: 10px; border-radius: 8px;">${resetUrl}</p>
        <p style="font-size: 12px; color: #738077;">This secure link expires in 30 minutes. If you did not make this request, you can safely ignore this email. Your existing password will remain unchanged.</p>
        <div class="footer">
          Assam Land Records & Verification Platform • Dharitri Sentu
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dharitri Sentu - Password Reset\n\nHello ${userName},\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis secure link expires in 30 minutes. If you did not make this request, you can safely ignore this email.`;

  return sendEmail({ to: toEmail, subject, html, text });
}

export async function sendSellerEnquiryEmail({
  sellerEmail,
  sellerName = 'Land Seller',
  buyerName,
  buyerEmail,
  buyerPhone,
  listingTitle,
  parcelId,
  subject: enquirySubject,
  message,
  enquiryId,
}) {
  const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:5173';
  const dashboardUrl = `${baseUrl}/dashboard/seller`;
  const subject = enquirySubject || `New Buyer Enquiry: ${listingTitle} (Dag: ${parcelId})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5EC; margin: 0; padding: 20px; color: #172E29; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; border: 1px solid #DFD6C3; box-shadow: 0 4px 18px rgba(10,36,27,0.04); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: bold; color: #0A241B; letter-spacing: -0.5px; }
        .tagline { font-size: 10px; color: #426B42; font-weight: bold; letter-spacing: 2px; }
        .badge { display: inline-block; background-color: #EBF3ED; color: #123F32; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        .card { background-color: #F8F5EC; border: 1px solid #DFD6C3; border-radius: 14px; padding: 18px; margin: 20px 0; }
        .meta-label { font-size: 11px; text-transform: uppercase; color: #738077; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 2px; }
        .meta-val { font-size: 14px; color: #123F32; font-weight: 600; margin-bottom: 12px; }
        .msg-box { background: #ffffff; border-left: 4px solid #426B42; border-radius: 6px; padding: 14px; font-size: 14px; line-height: 1.6; color: #22332A; margin-top: 14px; }
        .button { display: inline-block; background-color: #123F32; color: #F8FAF7 !important; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; margin: 20px 0; }
        .footer { font-size: 11px; color: #738077; border-top: 1px solid #EBE5D8; margin-top: 32px; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Dharitri Sentu</div>
          <div class="tagline">LAND · EVIDENCE · TRUST</div>
        </div>
        <div style="text-align: center;">
          <span class="badge">🔔 Direct Buyer Notification</span>
        </div>
        <h2 style="color: #123F32; margin-top: 0;">New Listing Enquiry Received</h2>
        <p>Hello ${sellerName},</p>
        <p>A prospective buyer has reached out regarding your land listing on Dharitri Sentu.</p>

        <div class="card">
          <div class="meta-label">Listing Subject</div>
          <div class="meta-val">${subject}</div>

          <div class="meta-label">Parcel Dag No. / Title</div>
          <div class="meta-val">${listingTitle} (Dag #${parcelId || 'N/A'})</div>

          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div>
              <div class="meta-label">Buyer Name</div>
              <div class="meta-val">${buyerName}</div>
            </div>
            <div>
              <div class="meta-label">Buyer Email</div>
              <div class="meta-val"><a href="mailto:${buyerEmail}" style="color: #426B42;">${buyerEmail}</a></div>
            </div>
            ${buyerPhone ? `<div><div class="meta-label">Buyer Phone</div><div class="meta-val"><a href="tel:${buyerPhone}" style="color: #426B42;">${buyerPhone}</a></div></div>` : ''}
          </div>

          <div class="meta-label" style="margin-top: 6px;">Buyer's Message</div>
          <div class="msg-box">
            ${message.replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="button" target="_blank">Open Seller Dashboard & Reply →</a>
        </div>

        <p style="font-size: 12px; color: #738077; text-align: center;">
          You can review the buyer's Trust Passport and reply directly from your Seller Dashboard workspace.
        </p>

        <div class="footer">
          Assam Land Records & Verification Platform • Dharitri Sentu<br/>
          Reference ID: ${enquiryId || 'ENQ-' + Date.now()}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dharitri Sentu - New Buyer Enquiry\n\nHello ${sellerName},\n\nYou have received a new enquiry for ${listingTitle} (Dag #${parcelId || 'N/A'}).\n\nFrom: ${buyerName} (${buyerEmail}${buyerPhone ? ', Phone: ' + buyerPhone : ''})\nSubject: ${subject}\n\nMessage:\n${message}\n\nView and reply in your Seller Dashboard:\n${dashboardUrl}\n\nReference: ${enquiryId || 'ENQ'}`;

  try {
    return await sendEmail({ to: sellerEmail, subject, html, text });
  } catch (err) {
    console.warn(`[Email] Could not dispatch seller enquiry email to ${sellerEmail}:`, err.message);
    return { ok: false, error: err.message, simulated: true };
  }
}

export async function sendChangePasswordOtpEmail({ toEmail, otpCode, userName = 'User' }) {
  const subject = `Your Security Verification Code: ${otpCode} - Dharitri Sentu`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5EC; margin: 0; padding: 20px; color: #172E29; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; border: 1px solid #DFD6C3; box-shadow: 0 4px 18px rgba(10,36,27,0.04); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: bold; color: #0A241B; letter-spacing: -0.5px; }
        .tagline { font-size: 10px; color: #426B42; font-weight: bold; letter-spacing: 2px; }
        .otp-box { background: #F8F5EC; border: 2px dashed #426B42; border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #123F32; margin: 24px 0; }
        .footer { font-size: 11px; color: #738077; border-top: 1px solid #EBE5D8; margin-top: 32px; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Dharitri Sentu</div>
          <div class="tagline">LAND · EVIDENCE · TRUST</div>
        </div>
        <h2 style="color: #123F32;">Security Verification Code</h2>
        <p>Hello ${userName},</p>
        <p>Use the following single-use verification code to update your account password or confirm sensitive security changes:</p>
        <div class="otp-box">${otpCode}</div>
        <p style="font-size: 12px; color: #738077;">This code is valid for 10 minutes. For your security, do not share this code with anyone. Dharitri Sentu staff will never ask for your code.</p>
        <div class="footer">
          Dharitri Sentu Security Desk • Automated Notification
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dharitri Sentu Verification Code: ${otpCode}\n\nHello ${userName},\n\nUse this 6-digit code to complete your password update or security verification: ${otpCode}\n\nValid for 10 minutes. Never share this code.`;

  try {
    return await sendEmail({ to: toEmail, subject, html, text });
  } catch (err) {
    console.warn(`[Email] Could not dispatch OTP email to ${toEmail}:`, err.message);
    return { ok: false, error: err.message, simulated: true };
  }
}

export async function sendBuyerReplyNotificationEmail({
  buyerEmail,
  buyerName = 'Valued Buyer',
  sellerName = 'Land Seller',
  listingTitle = 'Land Parcel',
  replyMessage,
  enquiryId,
}) {
  const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:5173';
  const dashboardUrl = `${baseUrl}/dashboard/buyer`;
  const subject = `Seller Replied: Inquiry regarding ${listingTitle} - Dharitri Sentu`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8F5EC; margin: 0; padding: 20px; color: #172E29; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; border: 1px solid #DFD6C3; box-shadow: 0 4px 18px rgba(10,36,27,0.04); }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: bold; color: #0A241B; letter-spacing: -0.5px; }
        .tagline { font-size: 10px; color: #426B42; font-weight: bold; letter-spacing: 2px; }
        .badge { display: inline-block; background-color: #EBF3ED; color: #123F32; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        .card { background-color: #F8F5EC; border: 1px solid #DFD6C3; border-radius: 14px; padding: 18px; margin: 20px 0; }
        .meta-label { font-size: 11px; text-transform: uppercase; color: #738077; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 2px; }
        .meta-val { font-size: 14px; color: #123F32; font-weight: 600; margin-bottom: 12px; }
        .msg-box { background: #ffffff; border-left: 4px solid #123F32; border-radius: 6px; padding: 14px; font-size: 14px; line-height: 1.6; color: #22332A; margin-top: 14px; }
        .button { display: inline-block; background-color: #123F32; color: #F8FAF7 !important; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; margin: 20px 0; }
        .footer { font-size: 11px; color: #738077; border-top: 1px solid #EBE5D8; margin-top: 32px; padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Dharitri Sentu</div>
          <div class="tagline">LAND · EVIDENCE · TRUST</div>
        </div>
        <div style="text-align: center;">
          <span class="badge">💬 Seller Response Alert</span>
        </div>
        <h2 style="color: #123F32; margin-top: 0;">The Land Seller Has Replied</h2>
        <p>Hello ${buyerName},</p>
        <p>The verified seller of <strong>${listingTitle}</strong> has responded to your enquiry on Dharitri Sentu.</p>

        <div class="card">
          <div class="meta-label">Listing</div>
          <div class="meta-val">${listingTitle}</div>

          <div class="meta-label">Seller</div>
          <div class="meta-val">${sellerName}</div>

          <div class="meta-label" style="margin-top: 6px;">Seller's Response</div>
          <div class="msg-box">
            ${(replyMessage || '').replace(/\n/g, '<br/>')}
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="button" target="_blank">Open Buyer Dashboard & View Thread →</a>
        </div>

        <p style="font-size: 12px; color: #738077; text-align: center;">
          You can inspect the seller's Land Trust Passport and coordinate due-diligence checklists in your dashboard.
        </p>

        <div class="footer">
          Assam Land Records & Verification Platform • Dharitri Sentu<br/>
          Reference ID: ${enquiryId || 'ENQ-' + Date.now()}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Dharitri Sentu - Seller Replied\n\nHello ${buyerName},\n\nThe verified seller (${sellerName}) has replied to your inquiry regarding ${listingTitle}.\n\nReply:\n${replyMessage}\n\nView thread in your Buyer Dashboard:\n${dashboardUrl}\n\nReference: ${enquiryId || 'ENQ'}`;

  try {
    return await sendEmail({ to: buyerEmail, subject, html, text });
  } catch (err) {
    console.warn(`[Email] Could not dispatch buyer reply email to ${buyerEmail}:`, err.message);
    return { ok: false, error: err.message, simulated: true };
  }
}
