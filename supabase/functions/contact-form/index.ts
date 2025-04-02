// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

console.log("Contact Form Function Started");

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { name, email, subject, message, to, recaptchaToken } = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message || !to || !recaptchaToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reCAPTCHA
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const recaptchaResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=6LcFRQMrAAAAAB94nfYWH1Oa3JyFwx7KuQFcGqai&response=${recaptchaToken}`,
    });

    const recaptchaData = await recaptchaResponse.json();
    console.log('reCAPTCHA verification result:', recaptchaData);

    if (!recaptchaData.success) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configure SMTP client
    // @ts-ignore
    const client = new SmtpClient();
    // @ts-ignore
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: "friendlybattlegames@gmail.com",
      // @ts-ignore
      password: Deno.env.get('SMTP_PASSWORD') || '',
    });

    // Send email
    await client.send({
      from: email,
      to: to,
      subject: `Contact Form: ${subject}`,
      content: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
      `,
    });

    await client.close();

    // Return success response
    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
