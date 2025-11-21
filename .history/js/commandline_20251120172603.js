const textarea = document.getElementById('command-input');

textarea.addEventListener('keypress', (event) => {
    console.log(event)
    if(keyCode === 13){
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