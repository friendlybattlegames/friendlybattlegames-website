// Store timestamp of last submission attempt
let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN = 60000; // 1 minute cooldown

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            // Check rate limiting
            const now = Date.now();
            if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
                alert('Please wait a moment before submitting another message.');
                return;
            }

            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            const honeypot = document.getElementById('website').value;

            // Check honeypot
            if (honeypot) {
                console.log('Bot detected');
                return;
            }

            // Get reCAPTCHA response
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                alert('Please complete the reCAPTCHA verification.');
                return;
            }

            // Disable submit button and show loading state
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Verify Supabase client
            if (!window.supabaseClient) {
                throw new Error('Supabase client not initialized');
            }

            // Log request details
            console.log('Sending message to Supabase:', {
                name,
                email,
                subject,
                message: message.substring(0, 20) + '...',
                recaptcha_token: recaptchaResponse.substring(0, 20) + '...'
            });

            // Insert message into contact_messages table
            const { data, error } = await window.supabaseClient
                .from('contact_messages')
                .insert({
                    name,
                    email,
                    subject,
                    message,
                    recaptcha_token: recaptchaResponse,
                    user_agent: navigator.userAgent,
                    status: 'pending'
                });

            // Log response
            console.log('Supabase response:', { data, error });

            if (error) {
                throw error;
            }

            // Update rate limiting
            lastSubmissionTime = now;

            // Show success message
            alert('Message sent successfully! We\'ll get back to you soon.');
            contactForm.reset();
            grecaptcha.reset();

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again later.');
            grecaptcha.reset();
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        }
    });
});

function containsSpamPatterns(text) {
    // List of spam patterns to check
    const spamPatterns = [
        /\b(viagra|cialis|casino|porn|sex|xxx)\b/i,
        /\b(buy|sell|cheap|discount|offer)\b.*\b(now|today|pills|meds)\b/i,
        /\b(loan|credit|cash|money|bitcoin|crypto)\b.*\b(fast|quick|easy|now)\b/i,
        /<[^>]*>/, // HTML tags
        /\b(http|https|www\.)\b/i, // URLs (basic check)
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b.*\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Multiple emails
    ];

    return spamPatterns.some(pattern => pattern.test(text));
}
