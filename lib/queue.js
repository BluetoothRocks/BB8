
(() => {
    'use strict';
    
    class Queue {

        constructor() {
            this._working = false;
            this._queue = [];
        }

        add(generator) {
            return new Promise(resolve => {
                this._queue.push({ generator, resolve });
                this._run();
            });
        }

        _run() {
            if (this._queue.length && !this._working) {
                this._working = true;

                let item = this._queue.shift();
                let generator = item.generator();

                if (generator instanceof Promise) {
                    generator.then(() => {
                        this._working = false;
                        this._run() 
                        item.resolve();
                    });
                } else {
                    this._working = false;
                    this._run() 
                    item.resolve();
                }
            }
        }
    }

    window.Queue = Queue;

})();



Delay = function(t) {
    return new Promise((resolve) => {
        setTimeout(resolve, t);
    });
}

Log = function(m) {
    return new Promise((resolve) => {
        console.log(m);
        resolve();
    });
}