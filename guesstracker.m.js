"use strict";

import { Store } from "./lib.m.js";

export var DEFAULT_CURRENT = {gamenumber:null,guesses:[]};

customElements.define("guess-tracker", class extends HTMLElement {

    #abort = new AbortController();
    current = new Store('current',DEFAULT_CURRENT);

    connectedCallback(){
        window.gameWorker.addEventListener('message',(e)=>this.#message(e),{signal:this.#abort.signal});
    }

    disconnectedCallback(){
        this.#abort.abort();
    }

    #message(e){
        let {type, value} = e.data;
        switch(type){
            case 'guessResult':
                this.addGuess(value);
                break;
            case 'gameStarted':
                this.newGame(value);
                break;
            default:
                return;
        }
    }

    addGuess(guess,record=true){
        console.log(typeof guess, guess);
        let {pattern, word} = guess;
        if(/^#+$/.test(pattern)){
            return 'nonce';
        }
        let newguess = document.createElement('guess-boxer');
        newguess.innerText = word;
        newguess.setAttribute('pattern', pattern);
        this.insertBefore(newguess,this.firstChild); //should be this.appendChild(newguess)
        //this is a workaround for bug w/ overflow and justify:end
        if(record){
            let guesses = this.current.get('guesses');
            console.log('guesses',guesses);
            guesses.push(guess);
            this.current.set('guesses',guesses);
        }
        return 'guess';
    }

    newGame(value){
        let {gamenumber} = value;
        console.log(gamenumber,' ?= ',this.current.get('gamenumber'));
        if(gamenumber == this.current.get('gamenumber')){
            console.log('yes');
            for(let guess of this.current.get('guesses')){
                console.log(guess);
                this.addGuess(guess,record=false);
            }
        } else {
            console.log('no');
            this.clear();
            for(let key in value){
                this.current.set(key,value[key]);
            }
        }
    }

    clear(){
        for(let key in DEFAULT_CURRENT){
            this.current.set(key,DEFAULT_CURRENT[key]);
        }
        this.innerText="";
    }

});