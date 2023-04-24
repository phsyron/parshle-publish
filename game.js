"use strict";

var MILISEC_IN_DAY = 24 * 60 * 60 * 1000;
var FIRST_GAME_DAY = 19437;

var today = (()=>{
    let d = new Date();
    return new Date(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) / MILISEC_IN_DAY - FIRST_GAME_DAY;
})();

class Game {

    tab = [];
    ptab = [];
    isDaily = false;
    #target;
    #gamenumber;

    constructor(target=null) {
        if(target == null){
            if(!globalThis.shortlist)
                throw new Error('default game created before shortlist');
            this.target = Math.abs(Math.sin(today));
            this.isDaily = true;
        } else {
            this.target = target
        }

        for(let i=0; i<this.target.length; i++){
            this.ptab[i] = new TableauCell(i+1,"+",this.target[i],i==0?null:this.ptab[i-1]);
        }
        let value = {
            target:this.target,
            today:this.isDaily ? today : null,
            gamenumber: this.gamenumber ?? null
        };
        globalThis.postMessage({type:'gameStarted',value});
    }

    get target(){
        return this.#target;
    }

    get gamenumber(){
        return this.#gamenumber;
    }

    set target(val){
        if(this.#target){
            throw new Error("Can't redefine target");
        }
        if(typeof val == 'string'){
            this.#target = val;
            this.#gamenumber = globalThis.shortlist.indexOf(this.target);
            return;
        }
        if(val < 1) {
            val *= globalThis.shortlist.length;
        }
        this.#gamenumber = Math.floor(val) % globalThis.shortlist.length;
        this.#target = globalThis.shortlist[this.#gamenumber];
    }

    guess(newGuess){
        if(newGuess == this.target){
            let cur = null;
            for(let letter of newGuess){
                cur = new TableauCell(0,'!',letter,cur);
            }
            return cur;
        }
        if(globalThis.longlist.indexOf(newGuess) == -1){
            let cur = null;
            let i = 0;
            for(let letter of newGuess){
              cur = new TableauCell(++i,'#',letter,cur)
            }
            return cur;
        }
        this.tab = [];
        this.gtab = [];
        for(let j=0; j<newGuess.length; j++){
            this.gtab[j] = new TableauCell(j+1,"-",newGuess[j],j==0?null:this.gtab[j-1]);
        }
        for(let i = 0; i<this.target.length; i++){
            this.tab[i] = [];
            for(let j = 0; j < newGuess.length; j++){
                if(this.target[i] == newGuess[j]){
                    let prev = this.gettab(i-1, j-1);
                    const prevscore = prev==null ? 0 : prev.score;
                    this.tab[i][j] = new TableauCell(prevscore,"=",this.target[i],prev);
                } else {
                    let up = this.gettab(i-1,j);
                    let left = this.gettab(i,j-1);
                    if(left.score < up.score){
                        this.tab[i][j] = new TableauCell(left.score + 1,'-',newGuess[j],left);
                    } else {
                        this.tab[i][j] = new TableauCell(up.score + 1,'+',this.target[i],up)
                    }
                }
            }
        }
        return this.gettab(this.target.length-1,newGuess.length-1);
    }

    gettab(i,j){
        if(i<0 & j<0)
            return null;
        if(i<0)
            return this.gtab[j];
        if(j<0)
            return this.ptab[i];
        return this.tab[i][j];
    }

    end(){
        return;
    }

}

class TableauCell {
    score;
    editType;
    editSymbol;
    backpointer;

    constructor(score, editType, editSymbol, backpointer){
        this.score = score;
        this.editType = editType;
        this.editSymbol = editSymbol;
        this.backpointer = backpointer;
    }

    normalized(){
        //let prev = (this.backpointer == null ? [] : this.backpointer.normalized());
        //return prev.concat([{type:this.editType, symbol:this.editSymbol}]);
        let a = [{type:this.editType, symbol:this.editSymbol}];
        let c = this;
        while (c.backpointer != null) {
            c = c.backpointer
            a = [{type:c.editType, symbol:c.editSymbol}].concat(a);
        }
        let adds = a.filter( x => x.type=='+' )
            .reduce( (acc,x) => {
                if(!(x.symbol in acc)){
                    acc[x.symbol] = 0;
                }
                acc[x.symbol] += 1;
                return acc;
            }, {});
        a.filter( x => x.type=='-' && x.symbol in adds)
            .forEach( x => {
                if( adds[x.symbol] > 0 ){
                    x.type = '~';
                    adds[x.symbol] -= 1;
                }
            });
        a = a.filter(x=>x.type != '+')
        let pattern = a.map(x=>x.type).join('');
        let word = a.map(x=>x.symbol).join('');
        return {pattern,word};
    }
}

var theGame = null;
var longlist;
(function(){
    let req = new XMLHttpRequest();
    req.onload = ()=>{
        longlist = JSON.parse(req.response);
        if(shortlist != null){
            globalThis.postMessage({type:'loaded',value:today});
         }
    }
    req.open("GET",'longlist.json');
    req.send();
})();
var shortlist;
(function(){
    let req = new XMLHttpRequest();
    req.onload = ()=>{
        shortlist = JSON.parse(req.response);
        if(longlist != null){
           globalThis.postMessage({type:'loaded',value:today});
        }
    }
    req.open("GET",'shortlist.json');
    req.send();
})();



onmessage = function(e){
    let {type, value} = e.data;
    switch(type){
        case "newGame":
            if(theGame != null){
                theGame.end()
            }
            theGame = new Game(value);
            break;
        case "guess":
            let ret = theGame.guess(value).normalized();
            console.log('guessed',typeof ret, ret);
            this.postMessage({type:'guessResult',value:ret});
            if(/^!+$/.test(ret.pattern)){
                this.postMessage({type:'gameWon',value:null});
            }
            break;
        default:
            console.log("didn't understand message type",type,value);
    }
}
