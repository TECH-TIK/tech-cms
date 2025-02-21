/**
 * Gestionnaire des notifications
 */
class NotificationManager {
    constructor() {
        if (window.notificationInstance) {
            return window.notificationInstance;
        }
        
        this.init();
        window.notificationInstance = this;
    }

    /**
     * Initialisation
     */
    init() {
        // Création du conteneur de notifications s'il n'existe pas
        this.container = document.getElementById('notifications-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Affiche une notification
     */
    show(data) {
        try {
            // Créer l'élément de notification
            const notification = document.createElement('div');
            notification.className = 'notification show';
            
            // Contenu de la notification
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-bell notification-icon"></i>
                    <div class="notification-message">${data.message}</div>
                </div>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            this.container.appendChild(notification);

            // Gérer le bouton de fermeture
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            });

            // Auto-fermeture après 5 secondes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }
            }, 5000);

        } catch (error) {
            console.error('Erreur lors de l\'affichage de la notification:', error);
        }
    }
}

// Export pour utilisation dans d'autres fichiers
window.NotificationManager = NotificationManager;

// Initialisation lors du chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.notifications = new NotificationManager();
});
