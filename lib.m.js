"use strict";

export var MILISEC_IN_DAY = 24 * 60 * 60 * 1000;
export var FIRST_GAME_DAY = 19437;

export var today = (()=>{
    let d = new Date();
    return new Date(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) / MILISEC_IN_DAY - FIRST_GAME_DAY;
})();

export class Store {

    #store = globalThis.localStorage ?? globalThis.sessionStorage;
    #def;
    #name;

    constructor(name,def){
        this.#name = name;
        this.#def = def;
    }

    get(key){
        return this.#get()[key];
    }

    set(key,value){
        let r = this.#get();
        r[key] = value;
        this.#set(r);
    }

    #get(){
        let r = this.#store.getItem(this.#name);
        if(!r){
            this.#set(this.#def);
            r = this.#store.getItem(this.#name);
        }
        return JSON.parse(r);
    }

    #set(val){
        if(val === undefined){
            this.#store.removeItem(this.#name);
        } else {
            this.#store.setItem(this.#name,JSON.stringify(val));
        }
    }

}