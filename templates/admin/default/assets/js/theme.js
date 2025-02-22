// Theme Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Theme Switcher
    const themeSwitcher = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    
    if (themeSwitcher) {
        // Check saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        updateTheme(savedTheme);
        
        themeSwitcher.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            updateTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    function updateTheme(theme) {
        // Update data-theme attribute
        htmlElement.setAttribute('data-theme', theme);
        
        // Update icons visibility
        updateThemeIcons(theme);
        
        // Update logos
        updateLogos(theme === 'dark');
    }

    function updateThemeIcons(theme) {
        const icons = themeSwitcher.querySelectorAll('i');
        icons.forEach(icon => icon.style.display = 'none');
        
        // Afficher l'icône opposée au thème actuel
        const activeIcon = theme === 'dark' ? '.theme-light' : '.theme-dark';
        themeSwitcher.querySelector(activeIcon).style.display = 'block';
    }

    function updateLogos(isDark) {
        const darkLogos = document.querySelectorAll('.dark-version');
        const lightLogos = document.querySelectorAll('.light-version');
        
        darkLogos.forEach(logo => logo.classList.toggle('d-none', !isDark));
        lightLogos.forEach(logo => logo.classList.toggle('d-none', isDark));
    }
    
    // Mobile Navigation
    const iconNavbarSidenav = document.getElementById('iconNavbarSidenav');
    const body = document.getElementsByTagName('body')[0];
    
    if (iconNavbarSidenav) {
        iconNavbarSidenav.addEventListener('click', function() {
            if (!body.classList.contains('g-sidenav-pinned')) {
                body.classList.add('g-sidenav-pinned');
                body.classList.remove('g-sidenav-hidden');
            } else {
                body.classList.remove('g-sidenav-pinned');
                body.classList.add('g-sidenav-hidden');
            }
        });
    }
    
    // Navbar Sticky
    const navbarMain = document.querySelector('.navbar-main');
    if (navbarMain) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 0) {
                navbarMain.classList.add('sticky-top', 'backdrop-blur-xl', 'bg-white/80');
            } else {
                navbarMain.classList.remove('sticky-top', 'backdrop-blur-xl', 'bg-white/80');
            }
        });
    }
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});
