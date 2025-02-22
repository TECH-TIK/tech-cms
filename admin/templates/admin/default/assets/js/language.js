document.addEventListener('DOMContentLoaded', function() {
    const languageSelector = document.querySelector('[data-component="language-selector"]');
    if (!languageSelector) return;

    const toggleButton = languageSelector.querySelector('[data-action="toggle-language"]');
    const menu = languageSelector.querySelector('[data-menu="language"]');
    const languageLinks = languageSelector.querySelectorAll('[data-action="change-language"]');

    // Ouvrir/fermer le menu
    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Fermer les autres menus
        document.querySelectorAll('.dropdown-menu.open').forEach(m => {
            if (m !== menu) m.classList.remove('open');
        });
        
        menu.classList.toggle('open');
    });

    // Fermer le menu en cliquant en dehors
    document.addEventListener('click', (e) => {
        if (!languageSelector.contains(e.target)) {
            menu.classList.remove('open');
        }
    });

    // Changer de langue
    languageLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const lang = link.dataset.lang;
            
            try {
                const response = await fetch('/admin/change-language', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ lang })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    // Mettre à jour l'indicateur de langue actuelle
                    const currentLangSpan = toggleButton.querySelector('.current-lang');
                    if (currentLangSpan) {
                        currentLangSpan.textContent = lang.toUpperCase();
                    }
                    
                    // Mettre à jour les classes active
                    languageLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // Fermer le menu
                    menu.classList.remove('open');
                    
                    // Recharger la page pour appliquer la nouvelle langue
                    window.location.reload();
                } else {
                    console.error('Erreur lors du changement de langue:', data.error);
                }
            } catch (error) {
                console.error('Erreur lors du changement de langue:', error);
            }
        });
    });
});
