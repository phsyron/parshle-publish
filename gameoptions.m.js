"use strict";

customElements.define('game-options', class extends HTMLElement {

    #abort = new AbortController();

    target;
    newGameButton = this.querySelector("button#newGame");
    cheatButton = this.querySelector("button#cheat");

    constructor(){
        super();
    }

    connectedCallback(){
        window.gameWorker.addEventListener('message',(e)=>this.#message(e),{signal:this.#abort.signal});
        this.newGameButton.addEventListener('click',(e)=>this.newGame(e),{signal:this.#abort.signal});
        this.cheatButton.addEventListener('click',(e)=>this.cheat(e),{signal:this.#abort.signal});
    }

    disconnectedCallback(){
        this.#abort.abort();
    }

    #message(e){
        let {type, value} = e.data;
        switch(type) {
            case 'gameStarted':
                this.target = value.target;
                break;
            default:
                return;
        }
    }

    newGame(_){
        globalThis.gameWorker.postMessage({type:"newGame",value:Math.random()});
    }

    cheat(_){
        window.alert(this.target);
    }


});