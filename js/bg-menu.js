document.addEventListener('DOMContentLoaded', () => {
    const settingsBtn = document.getElementById('app-settings-link');
    if (!settingsBtn) return;

    // create menu
    const bgMenu = document.createElement('div');
    bgMenu.id = 'bg-menu';
    bgMenu.className = 'bg-menu';
    bgMenu.innerHTML = `
        <div class="bg-menu__title">Cambiar fondo de pantalla</div>
        <div class="bg-menu__section">
            <div class="bg-menu__controls">
                <input id="bg-color-input" class="bg-color-input" type="color" aria-label="Color de fondo">
                <div class="bg-menu__presets">
                    <button class="bg-preset" data-value="linear-gradient(135deg,#2c001e 0%,#5E2750 100%)" title="Gradiente 1"></button>
                    <button class="bg-preset" data-value="linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)" title="Gradiente 2"></button>
                    <button class="bg-preset" data-value="linear-gradient(135deg,#1e3c72 0%,#2a5298 100%)" title="Gradiente 3"></button>
                </div>
            </div>
        </div>
        <div class="bg-menu__section">
            <label style="font-size:0.85rem;opacity:0.9">Imagen</label>
            <input id="bg-file-input" class="bg-file-input" type="file" accept="image/*" aria-label="Subir imagen de fondo">
        </div>
        <div class="bg-menu__actions">
            <button id="bg-reset" class="bg-action">Restablecer</button>
            <button id="bg-close" class="bg-action">Cerrar</button>
        </div>
    `;
    document.body.appendChild(bgMenu);

    const appDisplay = document.getElementById('application-display');
    const BG_TYPE_KEY = 'desktopBackgroundType';
    const BG_VALUE_KEY = 'desktopBackgroundValue';

    function applyBackground(type, value) {
        if (!appDisplay) return;
        if (type === 'color') {
            // Ensure any background image from CSS is overridden while color is active
            appDisplay.style.backgroundImage = 'none';
            appDisplay.style.backgroundColor = value;
        } else if (type === 'image') {
            appDisplay.style.backgroundImage = `url('${value}')`;
            appDisplay.style.backgroundSize = 'cover';
            appDisplay.style.backgroundPosition = 'center';
            appDisplay.style.backgroundColor = '';
        } else if (type === 'css') {
            // value is expected to be a CSS background-image value (e.g. linear-gradient(...))
            appDisplay.style.backgroundImage = value;
            appDisplay.style.backgroundSize = 'cover';
            appDisplay.style.backgroundPosition = 'center';
            appDisplay.style.backgroundColor = '';
        } else {
            // Clear inline styles so stylesheet default (assets image) is used again
            appDisplay.style.backgroundImage = '';
            appDisplay.style.backgroundColor = '';
        }
        try { localStorage.setItem(BG_TYPE_KEY, type || ''); localStorage.setItem(BG_VALUE_KEY, value || ''); } catch (e) { }
    }

    // load saved
    try {
        const t = localStorage.getItem(BG_TYPE_KEY);
        const v = localStorage.getItem(BG_VALUE_KEY);
        if (t && v) applyBackground(t, v);
    } catch (e) {}

    // positioning helper
    function openMenu() {
        // toggle
        const isOpen = bgMenu.classList.contains('show');
        if (isOpen) {
            bgMenu.classList.remove('show');
            bgMenu.style.display = 'none';
            settingsBtn.setAttribute('aria-expanded', 'false');
            return;
        }
        // show and position
        bgMenu.style.display = 'flex';
        bgMenu.classList.remove('anchor-left');
        requestAnimationFrame(() => {
            const rect = settingsBtn.getBoundingClientRect();
            const menuW = bgMenu.offsetWidth;
            const menuH = bgMenu.offsetHeight;
            // prefer to the right of the sidebar
            let left = rect.right + 8;
            let anchorLeft = false;
            if (left + menuW > window.innerWidth - 8) {
                left = rect.left - menuW - 8;
                anchorLeft = true;
            }
            let top = rect.top + (rect.height / 2) - (menuH / 2);
            const margin = 8;
            if (top < margin) top = margin;
            if (top + menuH > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - menuH - margin);
            bgMenu.style.left = `${Math.max(8, left)}px`;
            bgMenu.style.top = `${top}px`;
            if (anchorLeft) bgMenu.classList.add('anchor-left');
            bgMenu.classList.add('show');
            settingsBtn.setAttribute('aria-expanded', 'true');
        });
    }

    settingsBtn.addEventListener('click', (e) => { e.preventDefault(); openMenu(); });

    // close on outside click
    document.addEventListener('click', (ev) => {
        if (!bgMenu.contains(ev.target) && ev.target !== settingsBtn) {
            if (bgMenu.classList.contains('show')) {
                bgMenu.classList.remove('show'); bgMenu.style.display = 'none'; settingsBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // color input
    const colorInput = bgMenu.querySelector('#bg-color-input');
    colorInput.addEventListener('input', (e) => applyBackground('color', e.target.value));

    // presets: dibuja visualmente el preset y agrega el manejador de clic
    bgMenu.querySelectorAll('.bg-preset').forEach(btn => {
        const v = btn.dataset.value;
        if (v) {
            btn.style.background = v;
            btn.style.backgroundSize = 'cover';
            btn.style.backgroundPosition = 'center';
            btn.style.border = '1px solid rgba(0,0,0,0.12)';
        }
        btn.setAttribute('aria-label', btn.title || 'Preset');
        btn.addEventListener('click', () => applyBackground('css', btn.dataset.value));
    });

    // file input
    const fileInput = bgMenu.querySelector('#bg-file-input');
    fileInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => applyBackground('image', reader.result);
        reader.readAsDataURL(f);
    });

    // actions
    bgMenu.addEventListener('click', (ev) => {
        if (ev.target && ev.target.id === 'bg-reset') {
            try { localStorage.removeItem(BG_TYPE_KEY); localStorage.removeItem(BG_VALUE_KEY); } catch (e) {}
            applyBackground('', '');
        }
        if (ev.target && ev.target.id === 'bg-close') {
            bgMenu.classList.remove('show'); bgMenu.style.display = 'none'; settingsBtn.setAttribute('aria-expanded', 'false');
        }
    });

});
