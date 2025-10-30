const textarea = document.getElementById('cli');

textarea.addEventListener('keypress', ({key}) => {
    console.log(event);

    if(key === 'Enter'){
        console.log('Presionaste enter');
    }
})