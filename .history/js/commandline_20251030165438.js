const textarea = document.getElementById('cli');

textarea.addEventListener('keypress', ({keyCode}) => {
    console.log(event);

    if(key === 'Enter'){
        console.log('Presionaste enter');
    }
})