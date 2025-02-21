// Fonction de débogage
function debugLog(message, data = null) {
    console.log(`[Debug] ${message}`, data || '');
}

document.addEventListener('DOMContentLoaded', function() {
    // Gestion du thème
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    if (themeToggle) {
        // Get saved theme or default to auto
        const savedTheme = localStorage.getItem('theme') || 'auto';
        html.setAttribute('data-theme', savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            let newTheme = 'light';
            
            if (currentTheme === 'light') {
                newTheme = 'dark';
            } else if (currentTheme === 'dark') {
                newTheme = 'auto';
            }
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update system theme if auto
            if (newTheme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                html.classList.toggle('dark-mode', prefersDark);
            }
        });

        // Écouter les changements de thème système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (html.getAttribute('data-theme') === 'auto') {
                html.classList.toggle('dark-mode', e.matches);
            }
        });
    }

    // Gestion du menu utilisateur
    const userMenuBtn = document.querySelector('[data-action="toggle-profile"]');
    const profileMenu = document.querySelector('[data-menu="profile"]');
    
    if (userMenuBtn && profileMenu) {
        userMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            profileMenu.classList.toggle('active');
        });

        // Fermer le menu au clic en dehors
        document.addEventListener('click', (e) => {
            if (!e.target.closest('[data-component="user-menu"]')) {
                profileMenu.classList.remove('active');
            }
        });

        // Fermer le menu avec Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && profileMenu.classList.contains('active')) {
                profileMenu.classList.remove('active');
            }
        });
    }

    // Gestion des notifications
    const notificationBtn = document.querySelector('[data-action="toggle-notifications"]');
    const notificationsMenu = document.querySelector('[data-menu="notifications"]');
    
    if (notificationBtn && notificationsMenu) {
        notificationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notificationsMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('[data-component="notifications"]')) {
                notificationsMenu.classList.remove('active');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && notificationsMenu.classList.contains('active')) {
                notificationsMenu.classList.remove('active');
            }
        });
    }
});
