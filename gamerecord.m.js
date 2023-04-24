"use strict";

import {Store} from "./lib.m.js";

export var DEFAULT_RECORD = {gamesWon:0,dailiesWon:{}};

customElements.define("game-record", class extends HTMLElement {

    #abort = new AbortController();
    record = new Store('record', DEFAULT_RECORD);
    gamesWon = this.querySelector('#gamesWon');
    dailiesWon = this.querySelector('#dailiesWon');

    constructor(){
        super();
        this.update();
    }

    connectedCallback(){
        window.gameWorker.addEventListener('message',(e)=>this.#message(e),{signal:this.#abort.signal});
    }

    disconnectedCallback(){
        this.#abort.abort();
    }

    #message(e){
        let {type, value} = e.data;
        switch(type){
            case "gameStarted":
                this.today = value.today ?? null;
                this.gamenumber = value.gamenumber ?? null;
                break;
            case "gameWon":
                this.gameWon();
                this.update();
            default:
                return;
        }
    }

    gameWon(){
        if(this.today){
            let dsWon = this.record.get('dailiesWon');
            if(this.today in dsWon)
                return;
            dsWon[this.today] = true;
            this.record.set('dailiesWon',dsWon);
        }
        this.record.set('gamesWon',this.record.get('gamesWon') + 1);
    }

    update(){
        let r = this.record;
        this.gamesWon.innerText = r.get('gamesWon');
        this.dailiesWon.innerText = Object.keys(r.get('dailiesWon')).length;
    }

});