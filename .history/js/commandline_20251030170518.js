const textarea = document.getElementById('cli');

textarea.addEventListener('keypress', ({keyCode}) => {
    if(keyCode === 13){
        console.log(textarea.value)
    }
})