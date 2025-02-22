document.addEventListener('DOMContentLoaded', function() {
    // Gestion du thème
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        function setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Mise à jour des icônes
            const lightIcon = themeToggle.querySelector('.theme-light');
            const darkIcon = themeToggle.querySelector('.theme-dark');
            
            if (theme === 'dark' || (theme === 'auto' && prefersDarkScheme.matches)) {
                lightIcon.style.display = 'none';
                darkIcon.style.display = 'block';
                document.documentElement.classList.add('dark-mode');
            } else {
                lightIcon.style.display = 'block';
                darkIcon.style.display = 'none';
                document.documentElement.classList.remove('dark-mode');
            }
        }
        
        // Initialisation du thème
        const savedTheme = localStorage.getItem('theme') || 'auto';
        setTheme(savedTheme);
        
        // Gestion du clic sur le bouton de thème
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                setTheme('light');
            } else if (currentTheme === 'light') {
                setTheme('auto');
            } else {
                setTheme('dark');
            }
        });
    }
    
    // Gestion du menu mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Fermer le menu au clic en dehors
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
    
    // Gestion des notifications
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            // TODO: Implémenter la logique des notifications
            console.log('Notifications clicked');
        });
    }
    
    // Menu utilisateur
    const userMenuBtn = document.querySelector('.user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', () => {
            // TODO: Implémenter la logique du menu utilisateur
            console.log('User menu clicked');
        });
    }

    // Gestionnaire de soumission du formulaire de suppression
    const deleteForm = document.querySelector('form[data-action="delete"]');
    if (deleteForm) {
        deleteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]');
                if (!csrfToken) {
                    throw new Error('CSRF token not found');
                }

                const response = await fetch(this.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken.content
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Recharger la page après la suppression
                    window.location.reload();
                } else {
                    showNotification(data.message || 'Une erreur est survenue', 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showNotification('Une erreur est survenue lors de la suppression', 'error');
            }
        });
    }

    // Fonction pour afficher les notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    // Gestionnaire des modales de confirmation
    const confirmationModals = document.querySelectorAll('[data-confirm]');
    if (confirmationModals.length > 0) {
        confirmationModals.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const message = trigger.getAttribute('data-confirm');
                if (confirm(message)) {
                    window.location.href = trigger.href;
                }
            });
        });
    }

    // Gestionnaire de recherche
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    performSearch(query);
                }
            }, 300);
        });
    }

    // Fonction de recherche
    async function performSearch(query) {
        try {
            const response = await fetch(`/admin/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            updateSearchResults(data.results);
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            showNotification('Erreur lors de la recherche', 'error');
        }
    }

    // Mise à jour des résultats de recherche
    function updateSearchResults(results) {
        const resultsContainer = document.querySelector('.search-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Aucun résultat trouvé</div>';
            return;
        }

        const list = document.createElement('ul');
        results.forEach(result => {
            const item = document.createElement('li');
            item.innerHTML = `
                <a href="${result.url}">
                    <i class="fas ${result.icon}"></i>
                    <span>${result.title}</span>
                </a>
            `;
            list.appendChild(item);
        });

        resultsContainer.appendChild(list);
    }

    // Gestionnaire de tableaux triables
    const sortableHeaders = document.querySelectorAll('th[data-sort]');
    if (sortableHeaders.length > 0) {
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const table = header.closest('table');
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const column = header.cellIndex;
                const type = header.getAttribute('data-sort');
                const isAsc = !header.classList.contains('asc');
                
                // Mise à jour des classes de tri
                sortableHeaders.forEach(h => h.classList.remove('asc', 'desc'));
                header.classList.add(isAsc ? 'asc' : 'desc');
                
                // Tri des lignes
                rows.sort((a, b) => {
                    const aValue = a.cells[column].textContent.trim();
                    const bValue = b.cells[column].textContent.trim();
                    
                    if (type === 'number') {
                        return isAsc ? 
                            parseFloat(aValue) - parseFloat(bValue) : 
                            parseFloat(bValue) - parseFloat(aValue);
                    } else if (type === 'date') {
                        return isAsc ? 
                            new Date(aValue) - new Date(bValue) : 
                            new Date(bValue) - new Date(aValue);
                    } else {
                        return isAsc ? 
                            aValue.localeCompare(bValue) : 
                            bValue.localeCompare(aValue);
                    }
                });
                
                // Réorganisation des lignes
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    }
});
