const textarea = document.getElementById('cli');

textarea.addEventListener('keypress', ({keyCode}) => {
    if(keyCode === 13){
        const command = textarea.value;

        switch (command) {
            case 'ping ':
                
                break;
        
            default:
                break;
        }

    }
})