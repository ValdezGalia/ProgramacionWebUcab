const textarea = document.getElementById('command-input');

textarea.addEventListener('keypress', ({key}) => {
    console.log(key)
    if(keyCode === "Enter"){
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