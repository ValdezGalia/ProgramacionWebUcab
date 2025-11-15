
document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('application-display');
    const navLinks = document.querySelectorAll('#app-list a');
    let currentWindow = null; // Referencia a la ventana activa
    // Mapa de ventanas abiertas por herramienta (toolName -> array of windowDiv)
    const openWindows = {};

    // Taskbar and toast helpers are created by `js/lan-windows-helpers.js`.
    // Use the globals exposed by that helper, or fall back to DOM lookups.
    const taskbar = window.taskbar || document.getElementById('app-taskbar');
    const taskbarLeft = window.taskbarLeft || (taskbar && taskbar.querySelector('.taskbar-left'));
    const taskbarRight = window.taskbarRight || (taskbar && taskbar.querySelector('.taskbar-right'));

    // Límite de instancias por herramienta
    const MAX_INSTANCES = 3;

    const toastContainer = window.toastContainer || document.getElementById('app-toast-container');
    const showToast = window.showToast || ((msg, timeout = 2500) => {
        const t = document.createElement('div');
        t.className = 'app-toast';
        t.textContent = msg;
        if (toastContainer) {
            toastContainer.appendChild(t);
            requestAnimationFrame(() => t.classList.add('show'));
            setTimeout(() => {
                t.classList.remove('show');
                setTimeout(() => t.remove(), 300);
            }, timeout);
        } else {
            // fallback: alert
            alert(msg);
        }
    });

    const addTaskButton = (toolName, windowDiv) => {
        const btn = document.createElement('button');
        btn.className = 'task-btn';
        btn.type = 'button';
        btn.title = toolName; // tooltip

        // icon element and label (label hidden by default, shown on hover)
        const img = document.createElement('img');
        img.className = 'task-btn__icon';
        const label = document.createElement('span');
        label.className = 'task-btn__label';
        label.textContent = toolName;
        // badge to show instance number
        const badge = document.createElement('span');
        badge.className = 'task-btn__badge';
        badge.textContent = '';

        btn.appendChild(img);
        btn.appendChild(label);
        btn.appendChild(badge);

        // Try loading possible icon paths (png then svg, try lowercase name too)
        // Allow explicit icon via nav link data-icon attribute
        const navLink = findNavLink(toolName);
        const explicitIcon = navLink && navLink.dataset && navLink.dataset.icon ? navLink.dataset.icon : null;
        const candidates = explicitIcon ? [explicitIcon] : [];
        candidates.push(
            `assets/img/${toolName}.png`,
            `assets/img/${toolName}.svg`,
            `assets/img/${toolName.toLowerCase()}.png`,
            `assets/img/${toolName.toLowerCase()}.svg`
        );
        let tryIndex = 0;
        const tryNext = () => {
            if (tryIndex >= candidates.length) {
                // No icon available: hide img and keep label visible (fallback)
                img.style.display = 'none';
                label.style.display = 'inline-block';
                return;
            }
            img.src = candidates[tryIndex++];
            img.onload = () => {
                // icon loaded, keep label hidden (but available as tooltip)
                label.style.display = 'none';
            };
            img.onerror = () => {
                tryNext();
            };
        };
        tryNext();

        btn.addEventListener('click', () => {
            // Toggle minimizar/restaurar
            if (windowDiv.classList.contains('minimized')) {
                windowDiv.classList.remove('minimized');
                windowDiv.style.zIndex = getHighestZIndex() + 1;
                btn.classList.remove('task-btn--minimized');
                windowDiv.removeAttribute('aria-hidden');
            } else {
                windowDiv.classList.add('minimized');
                btn.classList.add('task-btn--minimized');
                windowDiv.setAttribute('aria-hidden', 'true');
            }
        });

    // asociar
    windowDiv._taskButton = btn;
    // append to left container so right side remains for clock/toggles
    taskbarLeft.appendChild(btn);
        // Update badge text according to all open instances of this tool
        const updateBadgeFor = () => {
            const arr = openWindows[toolName] || [];
            const index = arr.indexOf(windowDiv);
            if (index !== -1) {
                const number = index + 1;
                badge.textContent = number > 1 ? number.toString() : '';
                // update tooltip to include instance number
                btn.title = number > 1 ? `${toolName} (${number})` : toolName;
                label.textContent = number > 1 ? `${toolName} (${number})` : toolName;
            }
        };
        updateBadgeFor();
    };

    // Theme and clock controls (right side)
    const clockEl = document.createElement('div');
    clockEl.id = 'taskbar-clock';
    clockEl.className = 'taskbar-clock';
    clockEl.textContent = '';
    taskbarRight.appendChild(clockEl);

    const themeBtn = document.createElement('button');
    themeBtn.id = 'theme-toggle-btn';
    themeBtn.className = 'theme-toggle-btn';
    themeBtn.type = 'button';
    themeBtn.title = 'Cambiar tema';
    taskbarRight.appendChild(themeBtn);

    // Modal dialog handled by `js/lan-windows-modal.js` which exposes showModal/hideModal

    // Botón para cerrar todas las ventanas abiertas
    const closeAllBtn = document.createElement('button');
    closeAllBtn.id = 'close-all-btn';
    closeAllBtn.className = 'close-all-btn';
    closeAllBtn.type = 'button';
    closeAllBtn.title = 'Cerrar todas las ventanas';
    closeAllBtn.textContent = 'Cerrar todo';
    closeAllBtn.addEventListener('click', () => {
        showModal('¿Cerrar todas las ventanas abiertas?', () => {
            closeAllWindows();
        }, () => {
            // canceled
        });
    });
    taskbarRight.appendChild(closeAllBtn);

    // Actualiza el estado (visibilidad / habilitado) del botón "Cerrar todo"
    const updateCloseAllButtonState = () => {
        // contar instancias abiertas
        const total = Object.values(openWindows).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);
        // Si no hay instancias, escondemos ("cerrado") el botón
        if (total === 0) {
            closeAllBtn.style.display = 'none';
            closeAllBtn.disabled = true;
        } else {
            closeAllBtn.style.display = '';
            // Si hay más de 2 ventanas, deshabilitar el botón
            if (total <= 2) {
                closeAllBtn.disabled = true;
            } else {
                closeAllBtn.disabled = false;
            }
        }
        // reflejar visualmente (clase) para CSS
        closeAllBtn.classList.toggle('is-disabled', !!closeAllBtn.disabled);
    };

    // Inicializar estado del botón
    updateCloseAllButtonState();

    // If we saved footer HTML earlier, append it now at the end (so status sits at far right)
    if (taskbar._savedFooterHtml) {
        const statusWrapper = document.createElement('div');
        statusWrapper.className = 'footer-status';
        statusWrapper.innerHTML = taskbar._savedFooterHtml;
        taskbarRight.appendChild(statusWrapper);
        // clear saved copy
        delete taskbar._savedFooterHtml;
    }

    // Theme handling
    // Apply theme only to the parent shell. Use a parent-specific storage key so
    // iframe content (which may read a different key) is not affected.
    const PARENT_THEME_KEY = 'desktopThemeParent';
    const applyTheme = (theme) => {
        document.documentElement.classList.toggle('theme-light', theme === 'light');
        document.documentElement.classList.toggle('theme-dark', theme === 'dark');
        // Persist only for the parent shell under a dedicated key to avoid
        // affecting iframes that might read 'desktopTheme'.
        try { localStorage.setItem(PARENT_THEME_KEY, theme); } catch (e) { /* ignore */ }
        // Also proactively remove any shared key that some iframe pages might read
        // (legacy 'desktopTheme') to avoid propagating the shell theme into iframes.
        try { localStorage.removeItem('desktopTheme'); } catch (e) { /* ignore */ }
        // update icon
        themeBtn.textContent = theme === 'light' ? '☀️' : '🌙';
    };

    // initialize theme from parent-specific storage key or prefer dark
    // Ensure any legacy key that could influence iframes is removed before init
    try { localStorage.removeItem('desktopTheme'); } catch (e) { /* ignore */ }
    const savedTheme = (function(){ try { return localStorage.getItem(PARENT_THEME_KEY); } catch(e) { return null; } })() || 'dark';
    applyTheme(savedTheme);

    themeBtn.addEventListener('click', () => {
        const current = document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
    });

    // Clock
    const updateClock = () => {
        const now = new Date();
        const time = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        const date = now.toLocaleDateString();
        clockEl.textContent = `${time}  ·  ${date}`;
    };
    updateClock();
    setInterval(updateClock, 1000);

    // Helper: recalcula badges y titles para todas las instancias de una herramienta
    const updateInstanceBadges = (toolName) => {
        const arr = openWindows[toolName] || [];
        arr.forEach((wnd, i) => {
            const btn = wnd._taskButton;
            if (!btn) return;
            const badge = btn.querySelector('.task-btn__badge');
            const label = btn.querySelector('.task-btn__label');
            const number = i + 1;
            if (badge) badge.textContent = number > 1 ? number.toString() : '';
            if (btn) btn.title = number > 1 ? `${toolName} (${number})` : toolName;
            if (label) label.textContent = number > 1 ? `${toolName} (${number})` : toolName;
        });
    };

    const removeTaskButton = (windowDiv) => {
        const btn = windowDiv._taskButton;
        if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
        delete windowDiv._taskButton;
    };

    // Cerrar todas las ventanas abiertas
    const closeAllWindows = () => {
        const tools = Object.keys(openWindows);
        tools.forEach(tool => {
            const arr = openWindows[tool] || [];
            // clone array because we'll modify openWindows inside loop
            arr.slice().forEach(wnd => {
                // Remove iframe if present
                if (wnd._iframe && wnd._iframe.parentNode) wnd._iframe.parentNode.removeChild(wnd._iframe);
                // Remove task button
                removeTaskButton(wnd);
                // Remove from DOM
                if (wnd.parentNode) wnd.parentNode.removeChild(wnd);
            });
            delete openWindows[tool];
            // Remove active class from nav link
            const nav = findNavLink(tool);
            if (nav) nav.classList.remove('active');
        });
        showToast('Se han cerrado todas las ventanas.');
        try { updateCloseAllButtonState(); } catch (e) { /* ignore */ }
    };

    // Tu único iframe original (estaba en el HTML). Lo removemos del DOM porque
    // ahora crearemos un iframe por cada ventana cuando el usuario abra una aplicación.
    const originalIframe = document.getElementById('tool-iframe');
    if (originalIframe && originalIframe.parentNode) {
        originalIframe.parentNode.removeChild(originalIframe);
    }

    // ==========================================================
    // FUNCIONALIDAD DE ARRASTRE
    // ==========================================================
    // Versión optimizada que usa transform: translate3d y requestAnimationFrame
    // para aplicar transformaciones de forma asíncrona y fluida durante el arrastre.
    const makeWindowDraggable = (windowDiv, titleBar) => {
        let dragging = false;
        let offset = { x: 0, y: 0 };
        let activePointerId = null;
        let overlay = null;
        let baseLeft = 0;
        let baseTop = 0;
        let windowWidth = 0;
        let windowHeight = 0;
        let parentRect = null;

        let targetTranslate = { x: 0, y: 0 };
        let currentTranslate = { x: 0, y: 0 };
        let rafId = null;
        // factor de suavizado: cuanto más cercano a 1, más rígido; cercano a 0 más suave/lag
        const SMOOTHING = 0.18;

        const createOverlay = (z) => {
            const el = document.createElement('div');
            el.style.position = 'fixed';
            el.style.left = '0';
            el.style.top = '0';
            el.style.right = '0';
            el.style.bottom = '0';
            el.style.zIndex = z;
            el.style.background = 'transparent';
            el.setAttribute('aria-hidden', 'true');
            document.body.appendChild(el);
            return el;
        };

        // Loop de renderizado suave: interpola currentTranslate -> targetTranslate
        const startRAFLoop = () => {
            if (rafId != null) return; // ya corriendo
            const loop = () => {
                // Lerping (interpolación exponencial)
                currentTranslate.x += (targetTranslate.x - currentTranslate.x) * SMOOTHING;
                currentTranslate.y += (targetTranslate.y - currentTranslate.y) * SMOOTHING;

                // Aplicar transform
                windowDiv.style.transform = `translate3d(${currentTranslate.x}px, ${currentTranslate.y}px, 0)`;

                // Si la diferencia es mínima y no estamos dragging, podemos detener el loop
                const dx = Math.abs(targetTranslate.x - currentTranslate.x);
                const dy = Math.abs(targetTranslate.y - currentTranslate.y);

                // Continuar el bucle si la diferencia es significativa o si seguimos arrastrando
                if ((dx > 0.5 || dy > 0.5) || dragging) {
                    rafId = requestAnimationFrame(loop);
                } else {
                    // pequeña corrección final
                    windowDiv.style.transform = `translate3d(${targetTranslate.x}px, ${targetTranslate.y}px, 0)`;
                    rafId = null;
                }
            };
            rafId = requestAnimationFrame(loop);
        };

        const onPointerDown = (e) => {
            if (e.target.closest('.window-controls')) return;
            if (e.button && e.button !== 0) return;

            e.preventDefault();
            titleBar.setPointerCapture?.(e.pointerId);
            activePointerId = e.pointerId;
            dragging = true;

            windowDiv.style.position = 'absolute';
            windowDiv.style.willChange = 'transform';

            parentRect = mainContainer.getBoundingClientRect();
            const rect = windowDiv.getBoundingClientRect();

            offset.x = e.clientX - rect.left;
            offset.y = e.clientY - rect.top;

            baseLeft = rect.left - parentRect.left;
            baseTop = rect.top - parentRect.top;
            windowWidth = rect.width;
            windowHeight = rect.height;

            targetTranslate.x = 0;
            targetTranslate.y = 0;
            currentTranslate.x = 0;
            currentTranslate.y = 0;

            windowDiv.style.transform = `translate3d(0px, 0px, 0)`;
            windowDiv.style.zIndex = getHighestZIndex() + 1;
            overlay = createOverlay(parseInt(windowDiv.style.zIndex) + 1);
            titleBar.style.cursor = 'grabbing';
        };

        const onPointerMove = (e) => {
            if (!dragging || e.pointerId !== activePointerId) return;

            const desiredClientLeft = e.clientX - offset.x;
            const desiredClientTop = e.clientY - offset.y;

            let newLeft = desiredClientLeft - parentRect.left;
            let newTop = desiredClientTop - parentRect.top;

            newLeft = Math.max(0, newLeft);
            newTop = Math.max(0, newTop);
            newLeft = Math.min(newLeft, parentRect.width - windowWidth);
            newTop = Math.min(newTop, parentRect.height - windowHeight);

            targetTranslate.x = newLeft - baseLeft;
            targetTranslate.y = newTop - baseTop;

            // iniciar bucle RAF suave si no está corriendo
            startRAFLoop();
        };

        const onPointerUp = (e) => {
            if (!dragging || e.pointerId !== activePointerId) return;
            dragging = false;
            activePointerId = null;
            titleBar.releasePointerCapture?.(e.pointerId);

            // detener RAF loop y aplicar corrección final
            if (rafId != null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            // forzar que currentTranslate alcance target (corrección inmediata)
            currentTranslate.x = targetTranslate.x;
            currentTranslate.y = targetTranslate.y;

            const finalLeft = baseLeft + currentTranslate.x;
            const finalTop = baseTop + currentTranslate.y;
            windowDiv.style.left = `${finalLeft}px`;
            windowDiv.style.top = `${finalTop}px`;
            windowDiv.style.transform = '';
            windowDiv.style.willChange = '';

            titleBar.style.cursor = 'grab';
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            overlay = null;
        };

        titleBar.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);

        // Fallback para navegadores sin PointerEvent: mantener el fallback de mouse
        if (!window.PointerEvent) {
            let isMouseDragging = false;
            let mouseOffset = { x: 0, y: 0 };
            let mouseBaseLeft = 0, mouseBaseTop = 0;

            const mDown = (e) => {
                if (e.target.closest('.window-controls')) return;
                isMouseDragging = true;
                windowDiv.style.position = 'absolute';
                windowDiv.style.willChange = 'transform';
                const parent = mainContainer.getBoundingClientRect();
                const rect = windowDiv.getBoundingClientRect();
                mouseOffset.x = e.clientX - rect.left;
                mouseOffset.y = e.clientY - rect.top;
                mouseBaseLeft = rect.left - parent.left;
                mouseBaseTop = rect.top - parent.top;
                windowDiv.style.zIndex = getHighestZIndex() + 1;
                overlay = createOverlay(parseInt(windowDiv.style.zIndex) + 1);
                titleBar.style.cursor = 'grabbing';
            };

            const mMove = () => {
                if (!isMouseDragging) return;
                const parent = mainContainer.getBoundingClientRect();
                const rect = windowDiv.getBoundingClientRect();
                let newLeft = e.clientX - mouseOffset.x - parent.left;
                let newTop = e.clientY - mouseOffset.y - parent.top;
                newLeft = Math.max(0, newLeft);
                newTop = Math.max(0, newTop);
                newLeft = Math.min(newLeft, parent.width - rect.width);
                newTop = Math.min(newTop, parent.height - rect.height);
                const tx = newLeft - mouseBaseLeft;
                const ty = newTop - mouseBaseTop;
                windowDiv.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
            };

            const mUp = () => {
                if (!isMouseDragging) return;
                isMouseDragging = false;
                const parent = mainContainer.getBoundingClientRect();
                const rect = windowDiv.getBoundingClientRect();
                const computedLeft = rect.left - parent.left;
                const computedTop = rect.top - parent.top;
                windowDiv.style.left = `${computedLeft}px`;
                windowDiv.style.top = `${computedTop}px`;
                windowDiv.style.transform = '';
                windowDiv.style.willChange = '';
                titleBar.style.cursor = 'grab';
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                overlay = null;
            };

            titleBar.addEventListener('mousedown', mDown);
            document.addEventListener('mousemove', mMove);
            document.addEventListener('mouseup', mUp);
        }
    };
    // ==========================================================
    
    // Helper: buscar el enlace de navegación correspondiente a una herramienta
    const findNavLink = (toolName) => document.querySelector(`#app-list a[data-tool="${toolName}"]`);

    // 2. Función para crear la estructura de la ventana
    // Acepta forceNew (Shift/Ctrl/Cmd+click) para forzar nueva instancia
    const createWindowStructure = (toolName, forceNew = false) => {
        // Si ya existe(s) ventana(s) para esta herramienta y no forzamos nueva,
        // traer la primera existente al frente y no recargarla.
        if (!forceNew && openWindows[toolName] && openWindows[toolName].length > 0) {
            const existing = openWindows[toolName][0];
            // Restaurar si estaba minimizada
            existing.classList.remove('minimized');
            existing.style.zIndex = getHighestZIndex() + 1;
            currentWindow = existing;
            // Marcar el link como activo
            const nav = findNavLink(toolName);
            if (nav) nav.classList.add('active');
            // Actualizar botón del taskbar si existe (quitar estado minimizado)
            if (existing._taskButton) {
                existing._taskButton.classList.remove('task-btn--minimized');
                existing._taskButton.style.zIndex = getHighestZIndex() + 1;
            }
            return existing;
        }

        // Antes de crear nueva instancia: comprobar límite si se forzó la creación
        const currentCount = openWindows[toolName] ? openWindows[toolName].length : 0;
        if (forceNew && currentCount >= MAX_INSTANCES) {
            showToast(`Máximo de ${MAX_INSTANCES} instancias alcanzado para ${toolName}.`);
            // traer la última instancia al frente
            const last = openWindows[toolName] && openWindows[toolName][openWindows[toolName].length - 1];
            if (last) {
                last.classList.remove('minimized');
                last.style.zIndex = getHighestZIndex() + 1;
                currentWindow = last;
                return last;
            }
        }

        // Crear una nueva ventana sin cerrar las existentes (permitir múltiples ventanas)

        // Crear el contenedor de la ventana
        const windowDiv = document.createElement('div');
        windowDiv.classList.add('app-window');
        windowDiv.setAttribute('data-tool', toolName);
        
        // **IMPORTANTE**: Establecer una posición inicial (para que el arrastre funcione correctamente)
        // Puedes ajustar estos valores según dónde quieres que aparezca por primera vez.
        windowDiv.style.position = 'absolute'; 
        windowDiv.style.top = '50px'; 
        windowDiv.style.left = '50px';
        
        // Crear la barra de título
        const titleBar = document.createElement('div');
        titleBar.classList.add('window-titlebar');
        titleBar.innerHTML = `
            <span>${toolName}</span>
            <div class="window-controls">
                <button class="minimize-btn" title="Minimizar">—</button>
                <button class="maximize-btn" title="Maximizar">□</button>
                <button class="close-btn" title="Cerrar">✕</button>
            </div>
        `;
        
    // Contenedor para el Iframe
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('window-content');

    // Crear un iframe nuevo por cada ventana (permite múltiples ventanas simultáneas)
    const iframe = document.createElement('iframe');
    iframe.classList.add('tool-iframe');
    iframe.src = `pages/${toolName}.html`;
    iframe.setAttribute('frameborder', '0');
    // Mantener las mismas restricciones de sandbox si son necesarias
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.title = toolName;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.display = 'block';
    contentDiv.appendChild(iframe);

    // Guardar referencia al iframe en la ventana para manejo futuro
    windowDiv._iframe = iframe;

    // Generar ID de instancia y registrar la ventana en el mapa de abiertas
    // (soporta múltiples instancias por herramienta)
    if (!openWindows[toolName]) openWindows[toolName] = [];
    const instanceIndex = openWindows[toolName].length + 1;
    const instanceId = `${toolName}#${instanceIndex}`;
    windowDiv.dataset.instanceId = instanceId;
    windowDiv.dataset.instanceIndex = instanceIndex;
    openWindows[toolName].push(windowDiv);

    const navLinkForTool = findNavLink(toolName);
    if (navLinkForTool) navLinkForTool.classList.add('active');

    // Añadir botón al taskbar
    addTaskButton(toolName, windowDiv);
    // Actualizar badges para todas las instancias de esta herramienta
    updateInstanceBadges(toolName);
    // Actualizar estado del botón Cerrar todo
    try { updateCloseAllButtonState(); } catch (e) { /* ignore */ }

        // Ensamblar la ventana
        windowDiv.appendChild(titleBar);
        windowDiv.appendChild(contentDiv);
        mainContainer.appendChild(windowDiv);
        currentWindow = windowDiv;

        // Añadir manejadores de eventos a los botones y hacer la ventana arrastrable
        handleWindowControls(windowDiv, titleBar);
        // LLAMADA CLAVE: Hacer la ventana arrastrable
        makeWindowDraggable(windowDiv, titleBar);
    };

    // Manejar la lógica de los botones de control (Minimizar/Maximizar/Cerrar)
    const handleWindowControls = (windowDiv, titleBar) => {
        const minimizeBtn = windowDiv.querySelector('.minimize-btn');
        const maximizeBtn = windowDiv.querySelector('.maximize-btn');
        const closeBtn = windowDiv.querySelector('.close-btn');
        // Cerrar
        closeBtn.addEventListener('click', () => {
            windowDiv.classList.add('minimized'); // Lo "minimizamos" para quitarlo de la vista
            // Eliminar iframe asociado (si existe)
            if (windowDiv._iframe && windowDiv._iframe.parentNode) {
                windowDiv._iframe.parentNode.removeChild(windowDiv._iframe);
            }
                // Quitar del mapa de ventanas abiertas (solo la instancia cerrada)
                const tool = windowDiv.getAttribute('data-tool');
                if (tool && openWindows[tool]) {
                    const idx = openWindows[tool].indexOf(windowDiv);
                    if (idx !== -1) openWindows[tool].splice(idx, 1);
                    if (openWindows[tool].length === 0) {
                        delete openWindows[tool];
                        // Quitar clase active del enlace correspondiente si ya no hay instancias
                        const nav = findNavLink(tool);
                        if (nav) nav.classList.remove('active');
                    } else {
                        // Recalcular badges/titles para las instancias restantes
                        updateInstanceBadges(tool);
                    }
                }
            // Remover botón del taskbar
            removeTaskButton(windowDiv);

                    windowDiv.remove(); // Eliminar la ventana del DOM
                    // Actualizar estado del botón de cerrar todo
                    try { updateCloseAllButtonState(); } catch (e) { /* ignore */ }
            currentWindow = null;
        });

        // Minimizar (ocultar)
        minimizeBtn.addEventListener('click', () => {
            windowDiv.classList.toggle('minimized');
            // Actualizar estado visual del botón en el taskbar si existe
            if (windowDiv._taskButton) {
                if (windowDiv.classList.contains('minimized')) {
                    windowDiv._taskButton.classList.add('task-btn--minimized');
                    windowDiv.setAttribute('aria-hidden', 'true');
                } else {
                    windowDiv._taskButton.classList.remove('task-btn--minimized');
                    windowDiv._taskButton.style.zIndex = getHighestZIndex() + 1;
                    windowDiv.removeAttribute('aria-hidden');
                }
            }
        });

        // Maximizar/Restaurar con guardado de estado previo
        const maximizeWindow = () => {
            if (windowDiv.classList.contains('maximized')) return;
            const parentRect = mainContainer.getBoundingClientRect();
            // Guardar estado previo en dataset
            const prev = {
                left: windowDiv.style.left || '',
                top: windowDiv.style.top || '',
                width: windowDiv.style.width || '',
                height: windowDiv.style.height || '',
                position: windowDiv.style.position || '',
                transform: windowDiv.style.transform || ''
            };
            windowDiv.dataset.prevStyle = JSON.stringify(prev);

            // Aplicar maximizado: ocupar todo el contenedor
            windowDiv.style.position = 'absolute';
            windowDiv.style.left = '0px';
            windowDiv.style.top = '0px';
            windowDiv.style.width = `${parentRect.width}px`;
            windowDiv.style.height = `${parentRect.height}px`;
            windowDiv.style.transform = '';
            windowDiv.classList.add('maximized');
            maximizeBtn.innerHTML = '🗗';

            // Ajustar tamaño si se cambia la ventana del navegador
            const onResize = () => {
                const pr = mainContainer.getBoundingClientRect();
                windowDiv.style.width = `${pr.width}px`;
                windowDiv.style.height = `${pr.height}px`;
            };
            // guardar referencia para poder removerla luego
            windowDiv._onContainerResize = onResize;
            window.addEventListener('resize', onResize);
        };

        const restoreWindow = () => {
            if (!windowDiv.classList.contains('maximized')) return;
            const prev = windowDiv.dataset.prevStyle ? JSON.parse(windowDiv.dataset.prevStyle) : {};
            // Restaurar estilos previos
            if (prev.position !== undefined) windowDiv.style.position = prev.position;
            if (prev.left !== undefined) windowDiv.style.left = prev.left;
            if (prev.top !== undefined) windowDiv.style.top = prev.top;
            if (prev.width !== undefined) windowDiv.style.width = prev.width;
            if (prev.height !== undefined) windowDiv.style.height = prev.height;
            if (prev.transform !== undefined) windowDiv.style.transform = prev.transform;

            windowDiv.classList.remove('maximized');
            maximizeBtn.innerHTML = '□';

            // remover listener de resize si existe
            if (windowDiv._onContainerResize) {
                window.removeEventListener('resize', windowDiv._onContainerResize);
                delete windowDiv._onContainerResize;
            }
            delete windowDiv.dataset.prevStyle;
        };

        maximizeBtn.addEventListener('click', () => {
            if (windowDiv.classList.contains('maximized')) {
                restoreWindow();
            } else {
                maximizeWindow();
            }
        });

        // Doble click en la barra de título: alternar maximizar/restaurar
        titleBar.addEventListener('dblclick', (e) => {
            // Ignorar si el doble click fue sobre los controles (cerrar/maximizar/minimizar)
            if (e.target.closest('.window-controls')) return;
            if (windowDiv.classList.contains('maximized')) {
                restoreWindow();
            } else {
                maximizeWindow();
            }
        });

        // Extra: Clic en la barra de título trae la ventana al frente (sin arrastrar)
        titleBar.addEventListener('mousedown', (e) => {
             if (!e.target.closest('.window-controls')) { // Solo si no se hizo clic en un control
                windowDiv.style.zIndex = getHighestZIndex() + 1;
             }
        });
    };

    // Función auxiliar para traer la ventana al frente (simulación Z-Index)
    const getHighestZIndex = () => {
        // Asume que las ventanas comienzan en un z-index base de 100
        const zIndexes = Array.from(document.querySelectorAll('.app-window')).map(el => {
            return parseInt(el.style.zIndex) || 100;
        });
        return zIndexes.length ? Math.max(...zIndexes) : 100;
    };

    // 4. Lógica para manejar el clic en la barra de navegación
    const setActiveTool = (link, forceNew = false) => {
        // No eliminar la clase active de todos: mantenemos active para las aplicaciones
        // que actualmente tienen ventanas abiertas. Al hacer click intentamos crear la
        // ventana (o traer la existente al frente).
        const toolName = link.getAttribute('data-tool');

        const win = createWindowStructure(toolName, forceNew);
        // Si la ventana ya existía, createWindowStructure la devuelve y la trae al frente.
        if (win) {
            win.style.zIndex = getHighestZIndex() + 1;
            currentWindow = win;
        }
    };

    // Agregar oyentes de eventos a los enlaces de navegación
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const forceNew = event.shiftKey || event.ctrlKey || event.metaKey;
            setActiveTool(link, forceNew);
        });
    });

    // Estado inicial: Desactivar todos los íconos al inicio
    navLinks.forEach(navLink => navLink.classList.remove('active'));
});