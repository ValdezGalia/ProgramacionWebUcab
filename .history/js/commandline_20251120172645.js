const textarea = document.getElementById('command-input');

textarea.addEventListener('keypress', ({key}) => {
    console.log(key)
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