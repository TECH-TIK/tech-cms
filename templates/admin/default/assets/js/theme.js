// Theme Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Theme Switcher
    const themeSwitcher = document.getElementById('themeSwitcher');
    const htmlElement = document.documentElement;
    const icon = themeSwitcher.querySelector('i');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeSwitcher.addEventListener('click', function() {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Mettre à jour les logos
        const darkLogos = document.querySelectorAll('.dark-version');
        const lightLogos = document.querySelectorAll('.light-version');
        
        if (newTheme === 'dark') {
            darkLogos.forEach(logo => logo.classList.remove('d-none'));
            lightLogos.forEach(logo => logo.classList.add('d-none'));
        } else {
            darkLogos.forEach(logo => logo.classList.add('d-none'));
            lightLogos.forEach(logo => logo.classList.remove('d-none'));
        }
    });
    
    function updateThemeIcon(theme) {
        icon.classList.remove('fa-sun', 'fa-moon');
        icon.classList.add(theme === 'dark' ? 'fa-sun' : 'fa-moon');
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
