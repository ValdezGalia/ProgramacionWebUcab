const textarea = document.getElementById('command-input');

textarea.addEventListener('keypress', ({key}) => {
    if(key === "Enter"){
        const command = textarea.value;

        switch (command) {
            case 'ping':
                console.log("Hola mundo")
                
            break;
        
            default:
                break;
        }

    }
})