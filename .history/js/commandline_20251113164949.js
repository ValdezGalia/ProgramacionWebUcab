const textarea = document.getElementById('cli');

textarea.addEventListener('keypress', (event) => {
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