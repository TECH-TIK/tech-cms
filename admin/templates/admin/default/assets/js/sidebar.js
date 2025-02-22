document.addEventListener('DOMContentLoaded', function() {
    // Menu latéral pour mobile
    const menuToggle = document.querySelector('[data-action="toggle-sidebar"]');
    const sidebar = document.querySelector('[data-component="sidebar"]');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Ferme le menu latéral lorsque l'on clique en dehors sur mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target) && 
                sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Gestion des menus
    const menuToggles = document.querySelectorAll('.menu-toggle');
    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const parent = this.closest('.has-submenu');
            
            // Ferme tous les autres sous-menus
            document.querySelectorAll('.has-submenu').forEach(item => {
                if (item !== parent) {
                    item.classList.remove('open');
                }
            });
            
            // Bascule l'état du sous-menu actuel
            parent.classList.toggle('open');
        });
    });

    // Ouvre automatiquement le sous-menu parent si un élément est actif
    const activeSubmenuItem = document.querySelector('.submenu .active');
    if (activeSubmenuItem) {
        const parentMenu = activeSubmenuItem.closest('.has-submenu');
        if (parentMenu) {
            parentMenu.classList.add('open');
        }
    }
});
