const output = document.getElementById('terminal-output');
const input = document.getElementById('command-input');
const promptText = "user@simulador:~$ "; // Tu prompt base

document.getElementById('terminal-window').addEventListener('click', () => {
    input.focus();
});

input.addEventListener('keydown', ({ key }) => {
    if (key === "Enter") {
        const command = input.value.trim(); // Elimina espacios extra

        // 1. Imprimir el comando que el usuario escribió (Historial)
        // Usamos innerHTML para permitir saltos de línea si fuera necesario
        output.innerHTML += `\n<span class="prompt">${promptText}</span> ${command}`;

        // 2. Procesar el comando
        if (command !== "") {
            executeCommand(command);
        }

        // 3. Limpiar el input y hacer scroll hacia abajo
        input.value = '';
        scrollToBottom();
    }
});

function executeCommand(cmd) {
    const args = cmd.split(' '); // Dividir por espacios (para futuros argumentos)
    const mainCommand = args[0].toLowerCase(); 

    let response = "";

    switch (mainCommand) {
        case 'help':
            response = `Comandos disponibles:
                        help    - Muestra esta ayuda
                        ping    - Pong!
                        date    - Muestra la fecha y hora actual
                        clear   - Limpia la terminal
                        whoami  - Muestra el usuario actual`;
            break;

        case 'ping':
            response = "pong! (0ms)";
            break;

        case 'date':
            response = new Date().toString();
            break;

        case 'whoami':
            response = "user";
            break;

        case 'clear':
            // Caso especial: limpiamos todo y retornamos para no imprimir nada más
            output.innerHTML = "Bienvenido al Simulador. Escriba 'help' para comenzar.";
            return;

        default:
            response = `Orden no encontrada: ${mainCommand}`;
            break;
    }

    // Imprimir la respuesta del sistema
    if (response) {
        printOutput(response);
    }
}

function printOutput(text) {
    output.innerHTML += `\n${text}\n`;
}

function scrollToBottom() {
    const terminalWindow = document.getElementById('terminal-window');
    terminalWindow.scrollTop = terminalWindow.scrollHeight;
    // Opcional: Scroll de toda la página si la terminal ocupa todo
    window.scrollTo(0, document.body.scrollHeight);
}