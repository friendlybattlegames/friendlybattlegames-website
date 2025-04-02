document.addEventListener('DOMContentLoaded', () => {
    // Handle avatar dropdown toggle
    document.addEventListener('click', (e) => {
        const avatarButton = e.target.closest('.avatar-button');
        const dropdown = document.querySelector('.dropdown-content');
        const isClickInside = e.target.closest('.dropdown-content');
        
        if (avatarButton) {
            // Toggle dropdown and button active state
            dropdown.classList.toggle('show');
            avatarButton.classList.toggle('active');
        } else if (!isClickInside && dropdown) {
            // Close dropdown when clicking outside
            dropdown.classList.remove('show');
            document.querySelector('.avatar-button')?.classList.remove('active');
        }
    });

    // Handle sign out
    const signOutButton = document.getElementById('dropdown-signout');
    if (signOutButton) {
        signOutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const supabase = await window.getSupabase();
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }
});
