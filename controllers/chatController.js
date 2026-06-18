const supabase = require('../lib/supabase');

const SITE_CONTEXT = `You are Landproov's AI assistant. Landproov is a property verification, monitoring, and management service for Nigerians in the diaspora.

Services offered:
- Land & Property Verification: Title checks, registry searches, ownership history verification
- Land Registration, Survey & Documentation: C of O processing, Governor's Consent, boundary surveys, Deeds of Assignment
- Site Visits & Documentation: Physical inspection with photos, video, GPS location
- Quantity Surveying: Independent cost assessment of construction materials
- Agent & Developer Meetings: Attend meetings on your behalf and report back
- Project Monitoring: Recurring site visits during construction with progress reports

Website: landproov.com | Email: info@landproov.com | WhatsApp: +234 706 054 3899
Location: Serving Nigerians in the diaspora (UK, US, Canada, Europe, etc.)
Properties are in Nigeria.

Be concise, helpful, and professional. If asked something outside your knowledge, politely say you'll connect them with the Landproov team.`;

async function getAIResponse(message) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SITE_CONTEXT },
            { role: 'user', content: message },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI returned ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (err) {
      console.error('OpenAI error:', err.message);
      return fallbackResponse(message);
    }
  }

  return fallbackResponse(message);
}

function fallbackResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('verify') || msg.includes('verification') || msg.includes('title')) {
    return 'We verify land titles, Certificates of Occupancy, Deeds of Assignment, and run registry searches to confirm ownership. Would you like to book a consultation to get started?';
  }
  if (msg.includes('survey') || msg.includes('quantity')) {
    return 'Our Quantity Surveying service provides independent cost assessments of construction materials and labour, stage by stage. Contact us for a quote.';
  }
  if (msg.includes('monitor') || msg.includes('progress') || msg.includes('site visit')) {
    return 'Project Monitoring involves scheduled site visits with photo/video documentation and progress reports. We flag delays or substandard work early.';
  }
  if (msg.includes('registration') || msg.includes('document') || msg.includes('c of o') || msg.includes('title')) {
    return 'We handle land registration end-to-end: C of O processing, Governor\'s Consent, boundary surveys, Deeds of Assignment, and legal verification.';
  }
  if (msg.includes('price') || msg.includes('cost') || msg.includes('fee') || msg.includes('pricing') || msg.includes('how much')) {
    return 'Pricing varies by service and property location. Please visit our Pricing page or book a consultation for a personalised quote.';
  }
  if (msg.includes('contact') || msg.includes('email') || msg.includes('phone') || msg.includes('whatsapp') || msg.includes('reach')) {
    return 'You can reach us at info@landproov.com, WhatsApp +234 706 054 3899, or use the contact form on our website.';
  }
  if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey') || msg.includes('good')) {
    return 'Hello! Welcome to Landproov. I can help you with property verification, land registration, project monitoring, and more. How can I assist you today?';
  }
  if (msg.includes('rent') || msg.includes('management') || msg.includes('tenant')) {
    return 'Our Rental Property Management service covers tenant vetting, rent collection, maintenance coordination, and financial reporting. Contact us for details.';
  }
  if (msg.includes('agent') || msg.includes('developer') || msg.includes('meeting')) {
    return 'We attend meetings with selling agents, developers, or contractors on your behalf, ask the right questions, and report back with accurate findings.';
  }

  return 'I\'m not sure I understand. Could you rephrase? You can also email info@landproov.com or book a consultation for detailed assistance.';
}

module.exports = { getAIResponse };
