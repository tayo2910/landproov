const nodemailer = require('nodemailer');
const supabase = require('../lib/supabase');

function buildTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

async function saveToSupabase({ name, email, phone, location, propertyLocation, service, message }) {
  const { error } = await supabase.from('contact_enquiries').insert({
    name,
    email,
    phone,
    location,
    property_location: propertyLocation,
    service,
    message,
  });

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }

  console.log('Enquiry saved to Supabase');
}

async function sendContactEmail({ name, email, phone, location, propertyLocation, service, message }) {
  const transporter = buildTransporter();

  const html = `
    <h2>New Landproov Enquiry</h2>
    <table style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;">
      <tr><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #eee;">Name</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${name}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #eee;">Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${email}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${phone}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #eee;">Current Location</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${location}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #eee;">Property Location</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${propertyLocation}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #eee;">Service Needed</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${service}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #eee;vertical-align:top;">Message</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${message.replace(/\n/g, '<br>')}</td></tr>
    </table>
  `;

  const info = await transporter.sendMail({
    from: process.env.CONTACT_FROM || 'noreply@landproov.com',
    to: process.env.CONTACT_TO || 'info@landproov.com',
    subject: `New enquiry from ${name} — Landproov`,
    html,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Contact email preview:', nodemailer.getTestMessageUrl(info) || info.messageId);
  }
}

async function handleContact(data) {
  await Promise.all([
    saveToSupabase(data),
    sendContactEmail(data),
  ]);
}

module.exports = { handleContact };
