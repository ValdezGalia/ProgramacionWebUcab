document.addEventListener('DOMContentLoaded', () => {
        const mainContainer = document.getElementById('application-display');
        const navLinks = document.querySelectorAll('#app-list a');
        let currentWindow = null; // Referencia a la ventana activa

        // Tu único iframe original
        const originalIframe = document.getElementById('tool-iframe');

        // 1. Ocultar el iframe original y prepararlo para ser el contenido de la ventana
        originalIframe.style.display = 'none';

        // 2. Función para crear la estructura de la ventana
        const createWindowStructure = (toolName) => {
            // Si ya hay una ventana, ciérrala primero para evitar múltiples ventanas (o puedes manejar múltiples)
            if (currentWindow) {
                currentWindow.remove();
            }

            // Crear el contenedor de la ventana
            const windowDiv = document.createElement('div');
            windowDiv.classList.add('app-window');
            windowDiv.setAttribute('data-tool', toolName);
            
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
            
            // Mueve el iframe original dentro del contenido de la ventana
            contentDiv.appendChild(originalIframe);
            originalIframe.style.display = 'block'; // Mostrarlo dentro de la ventana

            // Ensamblar la ventana
            windowDiv.appendChild(titleBar);
            windowDiv.appendChild(contentDiv);
            mainContainer.appendChild(windowDiv);
            currentWindow = windowDiv;

            // Añadir manejadores de eventos a los botones
            handleWindowControls(windowDiv, titleBar);
        };

        // 3. Manejar la lógica de los botones de control (Minimizar/Maximizar/Cerrar)
        const handleWindowControls = (windowDiv, titleBar) => {
            const minimizeBtn = windowDiv.querySelector('.minimize-btn');
            const maximizeBtn = windowDiv.querySelector('.maximize-btn');
            const closeBtn = windowDiv.querySelector('.close-btn');

            // Cerrar
            closeBtn.addEventListener('click', () => {
                windowDiv.classList.add('minimized'); // Lo "minimizamos" para quitarlo de la vista
                windowDiv.remove(); // Opcional: Eliminar la ventana del DOM
                currentWindow = null;
                navLinks.forEach(navLink => navLink.classList.remove('active')); // Desactivar el ícono
                // Devolvemos el iframe original al contenedor principal para que pueda volver a usarse
                mainContainer.appendChild(originalIframe);
                originalIframe.style.display = 'none';
            });

            // Minimizar (ocultar)
            minimizeBtn.addEventListener('click', () => {
                windowDiv.classList.toggle('minimized');
                // Nota: Podrías querer un efecto de "barra de tareas" aquí en el footer
            });

            // Maximizar/Restaurar
            maximizeBtn.addEventListener('click', () => {
                windowDiv.classList.toggle('maximized');
                // Cambiar el ícono del botón
                maximizeBtn.innerHTML = windowDiv.classList.contains('maximized') ? '🗗' : '□'; 
            });
            
            // Extra: Clic en la barra de título trae la ventana al frente
            titleBar.addEventListener('mousedown', () => {
                windowDiv.style.zIndex = getHighestZIndex() + 1;
            });
        };

        // Función auxiliar para traer la ventana al frente (simulación Z-Index)
        const getHighestZIndex = () => {
            const zIndexes = Array.from(document.querySelectorAll('.app-window')).map(el => {
                return parseInt(el.style.zIndex) || 0;
            });
            return zIndexes.length ? Math.max(...zIndexes) : 100;
        };
        
        // 4. Lógica para manejar el clic en la barra de navegación
        const setActiveTool = (link) => {
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            link.classList.add('active');

            const toolName = link.getAttribute('data-tool');
            const newSrc = `pages/${toolName}.html`;

            // 5. Crear o restaurar la ventana
            if (!currentWindow || currentWindow.getAttribute('data-tool') !== toolName) {
                // Si no hay ventana o es una aplicación diferente
                createWindowStructure(toolName);
                originalIframe.src = newSrc; // Cargar la nueva URL
            } else if (currentWindow.classList.contains('minimized')) {
                // Si la aplicación ya está abierta pero minimizada, restaurarla
                currentWindow.classList.remove('minimized');
            }
            
            // Traer la ventana al frente
            currentWindow.style.zIndex = getHighestZIndex() + 1;
        };

        // Agregar oyentes de eventos a los enlaces de navegación
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                setActiveTool(link);
            });
        });

        // Estado inicial: Desactivar todos los íconos al inicio
        navLinks.forEach(navLink => navLink.classList.remove('active'));
    });