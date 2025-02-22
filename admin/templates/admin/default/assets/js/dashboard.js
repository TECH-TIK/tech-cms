document.addEventListener('DOMContentLoaded', function() {
    // Menu utilisateur
    const userMenuBtn = document.querySelector('.profile-button');
    const profileMenu = document.getElementById('profileMenu');
    
    if (userMenuBtn && profileMenu) {
        userMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            profileMenu.classList.toggle('show');
        });

        // Fermer le menu si on clique en dehors
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove('show');
            }
        });
    }

    // Animation des statistiques
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers) {
        statNumbers.forEach(number => {
            const finalNumber = parseInt(number.textContent);
            let currentNumber = 0;
            const duration = 1000; // 1 seconde
            const steps = 60;
            const increment = finalNumber / steps;
            const stepTime = duration / steps;
            
            const counter = setInterval(() => {
                currentNumber += increment;
                if (currentNumber >= finalNumber) {
                    number.textContent = finalNumber;
                    clearInterval(counter);
                } else {
                    number.textContent = Math.floor(currentNumber);
                }
            }, stepTime);
        });
    }

    // Recherche
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            // TODO: Implémenter la logique de recherche
            console.log('Searching for:', e.target.value);
        });
    }

    // Initialisation du temps réel
    if (window.realtime && window.realtime.ably) {
        console.log('[Dashboard] Temps réel initialisé');
    } else {
        console.error('[Dashboard] Le temps réel n\'est pas disponible');
    }
});
