// Fonction de débogage
function debugLog(message, data = null) {
    console.log(`[Debug] ${message}`, data || '');
}

document.addEventListener('DOMContentLoaded', function() {
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
