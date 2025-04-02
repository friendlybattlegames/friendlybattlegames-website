class ContactManager {
    constructor(supabase) {
        this.supabase = supabase;
        this.setupForm();
    }

    setupForm() {
        const form = document.getElementById('contact-form');
        if (!form) {
            console.error('ContactManager: Contact form not found');
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(e);
        });
    }

    async handleSubmit(event) {
        const form = event.target;
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;

        try {
            const formData = {
                name: form.querySelector('#name').value.trim(),
                email: form.querySelector('#email').value.trim(),
                message: form.querySelector('#message').value.trim()
            };

            if (!this.supabase) {
                throw new Error('Supabase client not initialized');
            }

            const { error } = await this.supabase
                .from('contact_messages')
                .insert(formData);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Show success message
            this.showMessage('Message sent successfully!', 'success');
            form.reset();

        } catch (error) {
            console.error('Error sending message:', error);
            this.showMessage('Failed to send message. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById('form-message');
        if (!messageDiv) {
            console.error('ContactManager: Message div not found');
            return;
        }

        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';

        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Initialize ContactManager when the DOM is loaded and Supabase is ready
document.addEventListener('DOMContentLoaded', () => {
    const checkSupabase = async () => {
        try {
            if (window.getSupabase) {
                console.log("ContactManager: Initializing...");
                const supabase = await window.getSupabase();
                console.log("ContactManager: Got Supabase client");
                window.contactManager = new ContactManager(supabase);
                console.log("ContactManager: Created instance");
            } else {
                console.log("ContactManager: Waiting for Supabase...");
                setTimeout(checkSupabase, 100);
            }
        } catch (error) {
            console.error('Error initializing ContactManager:', error);
        }
    };
    checkSupabase();
});
