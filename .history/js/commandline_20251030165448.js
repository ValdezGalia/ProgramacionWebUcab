const textarea = document.getElementById('cli');

textarea.addEventListener('keypress', ({keyCode}) => {
    console.log(event);

    if(keyCode === 13){
        console.log('Presionaste enter');
    }
})