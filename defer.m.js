"use strict";


window.gameWorker.addEventListener('message',m=>{
    console.log(m.data.type,m.data.value,m);
    let rec = document.querySelector('game-record').record;
    let cur = document.querySelector('guess-tracker').current;
    let {type,value} = m.data;
    if(type == 'loaded'){
        if(!(value in rec.get('dailiesWon'))){
            window.gameWorker.postMessage({type:'newGame',value:null});
        } else {
            console.log('already played today');
            for(let g of cur.get());
        }
    }
});

for( let button of document.querySelectorAll('header button[for]') ){
    let target = document.getElementById(button.getAttribute('for'));
    target.onclick = (e) => {if(e.target == target) target.close();}
    button.onclick = (e) => {target.showModal()};
}

window.gameWorker.addEventListener('message',(m)=>{
    let {type} = m.data;
    if(type == "gameWon"){
        document.querySelector('#congratulations').removeAttribute('hidden');
        document.querySelector('dialog#record').showModal();
    }
});

