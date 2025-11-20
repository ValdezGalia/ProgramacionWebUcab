const output = document.getElementById('terminal-output');
const input = document.getElementById('command-input');
const promptText = "user@simulador:~$ "; // Tu prompt base

document.getElementById('terminal-window').addEventListener('click', () => {
    input.focus();
});

input.addEventListener('keypress', ({key}) => {
    if(key === "Enter"){
        const command = textarea.value;

        switch (command) {
            case 'ping':
                textarea.value = '';
                
            break;
        
            default:
                break;
        }

    }
})