"use strict";

customElements.define("game-keyboard", class extends HTMLElement {

    #abort = new AbortController();

    constructor(){
        super();
        let template = document.querySelector("template#game-keyboard").content;
        this.appendChild(template.cloneNode(true));
        this.form = this.querySelector("form");
        this.form.onsubmit = (e) => {
            e.preventDefault();
            new FormData(e.target);
        };
        this.form.onformdata = (e) => {this.submit(e)};
        this.keys = this.querySelector("form > fieldset");
        this.addEventListener('click',e=>this.click(e));
        this.guessInput = this.querySelector('form > input');
        this.guessBoxer = this.querySelector('guess-boxer')
        document.addEventListener('keydown',e=>this.keydown(e));
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
            case 'gameStarted':
                this.keys.querySelectorAll('button').forEach(b=>{
                    b.classList.remove('sub','mov','eq');
                });
                this.keys.removeAttribute('disabled');
            case 'guessResult':
                this.guessed(value);
                break;
            case 'gameWon':
                this.keys.setAttribute('disabled','');
                break;
            default:
                return;
        }
    }

    click(e){
        let button = e.target;
        this.guessInput.blur();
        if(this.buttons.indexOf(button)==-1) return;
        let c = button.value
        console.log('button',c);
        switch(c){
            case "\u23CE": //Enter
                break;
            case "\u232B": //Backspace
                let v = this.guessInput.value;
                this.guessInput.setAttribute('value', v.substring(0,v.length-1));
                break;
            default:
                this.guessInput.setAttribute('value',this.guessInput.value + c)
        }
    }

    guessed(guess) {
        let {pattern,word} = guess;
        if(/^#+$/.test(pattern)){
            console.log(this.guessInput.value, '?=', word)
            if(this.guessInput.value == word){
                console.log('yes',this.guessBoxer)
                this.guessBoxer.setAttribute('pattern',pattern);
            }
        } else {
            this.guessInput.setAttribute('value','');
            this.guessBoxer.innerText = '';
            this.guessBoxer.setAttribute('pattern','');
        }
        for(let i in word){
            let type = pattern[i];
            let letter = word[i];
            if(type in this.guessBoxer.constructor.TYPES)
                type = this.guessBoxer.constructor.TYPES[type]
            this.querySelector(`button[value="${letter}"]`).classList.add(type)
        }
    }

    submit(e) {
        let {target: form, formData: data} = e;
        let guess = data.get('guessing');
        console.log(form,data,guess);
        gameWorker.postMessage({type:'guess',value:guess});
    }

    keydown(e){
        let k = e.key;
        if(k=='Enter' && document.querySelector(':focus'))
            return;
        if(/^\w$/.test(k))
            e.preventDefault();
        switch(k){
            case 'Enter':
                k = '\u23CE';
                break;
            case "Tab":
                return;
            case "Backspace":
                e.preventDefault();
                k = '\u232B';
                break;
            case " ":
                e.preventDefault();
                return;
            default:
                break;
        }
        let b = this.querySelector(`button[value="${k}"]`);
        if(b){
            b.click();
        }
    }

    setLayout(layout){
        let r = document.createElement('div')
        this.keys.appendChild(r);
        for(let c of layout){
            let el = "";
            switch(c){
                case ';':
                    r = document.createElement('div');
                    this.keys.appendChild(r);
                    break;
                case ':':
                    r.appendChild(document.createElement('div'));
                    break;
                case '\u23CE':
                    el = `<button value="${c}">&#x23CE;</button>`
                    break;
                case "\u232B":
                    el = `<button type="button" value="${c}">&#x232B;</button>`
                    break;
                default:
                    el = `<button type="button" value="${c}">${c}</button>`
            }
            if(el){
                r.insertAdjacentHTML("beforeend",el);
            }
        }
        this.buttons = Array.from(this.keys.querySelectorAll("button"));
    }

    static get observedAttributes(){
        return ['layout'];
    }

    attributeChangedCallback(attr){
        switch(attr){
            case "layout":
                this.setLayout(this.getAttribute("layout"));
                break;
            default:
                console.log("unknown attribute",attr);
        }
    }
});