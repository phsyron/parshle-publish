"use strict";

customElements.define("guess-boxer", class extends HTMLElement {

    static get TYPES(){
        return {
            '~': "mov",
            '+': "add",
            '-': "sub",
            '=': "eq",
            '!': "win",
            '#': 'wrong',
            '?': ''
        };
    }

    static STYLE = `
    .boxletter {
        display: inline-block;
        width:2em;
        height:2em;
        line-height:2em;
        margin:.1em;
        border-radius:10%;
        text-transform: capitalize;
        text-align: center;
        font-size: larger;
        vertical-align: middle;
        background-color: var(--color-sub);
    }

    .boxletter.eq {
        background-color: var(--color-eq);
    }

    .boxletter.mov {
        background-color: var(--color-mov);
    }

    .boxletter.add {
        display: none;
    }

    .boxletter.wrong {
        background-color: var(--color-wrong);
        transition: background-color .1s ease;
    }

    .boxletter.win {
        background-color: var(--color-win);
    }`;

    #watcher = new MutationObserver(this.mutation.bind(this));

    constructor(){
        super();
        this.attachShadow({mode:'open'});
        let style = document.createElement('style');
        style.textContent = this.constructor.STYLE;
        this.shadowRoot.appendChild(style);
        this.update(this.innerHTML);
        this.watch('');
    }

    static get observedAttributes(){
        return ['pattern','watch'];
    }

    attributeChangedCallback(attr,oldval,newval){
        switch(attr){
            case 'watch':
                this.watch(newval)
            case 'pattern':
                this.updatePattern(newval);
            default:
                return;
        }

    }

    get boxes(){
        return Array.from(this.shadowRoot.querySelectorAll('.boxletter'));
    }

    watch(newval){
        let target = newval ? document.querySelector(newval) : this;
        if(!target) return;
        this.#watcher.disconnect();
        this.#watcher.observe(target,{childList:true,attributes:true});
    }

    mutation(mutlist){
        for(let mut of mutlist){
            if(mut.target == this){
                if(mut.type != 'childList')
                    return;
                this.update(this.innerHTML);
            } else {
                if(mut.attributeName!='value')
                    return;
                this.update(mut.target[mut.attributeName]);
            }

        }
    }

    updatePattern(newPattern){
        for(let i in newPattern?.split('')){
            if( i >= this.boxes.length)
                return;
            let type = newPattern[i];
            if( type in this.constructor.TYPES ){
                type = this.constructor.TYPES[type];
            }
            if(type){
                this.boxes[i].classList.add(type);
            }
        }
    }

    update(newSymbols) {
        this.boxes.forEach(n=>this.shadowRoot.removeChild(n));
        if(newSymbols=='')
            return;
        for(let letter of newSymbols.split('')) {
            let el = document.createElement('span');
            el.classList.add('boxletter');
            el.innerText = letter;
            this.shadowRoot.appendChild(el);
        }
        let pat = this.getAttribute('pattern');
        this.updatePattern(/^#+$/.test(pat)? '' : pat);
    }
});