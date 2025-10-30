const textarea = document.getElementById('cli');

textarea.addEventListener('keypress', ({event}) => {
    console.log(event);
})