const states = {
    PENDING: 0,
    FULFILLED: 1,
    REJECTED: 2
};
class AplusPromise {
    constructor(fn) {
        this.state = states.PENDING;
        this.value = null;
        this.handlers = [];
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
        this.fulfill = this.fulfill.bind(this);
        this.handle = this.handle.bind(this);
        this.then = this.then.bind(this);
        this.done = this.done.bind(this);
        this.doResolve(fn, this.resolve, this.reject);
    }

    fulfill(value) {
        [this.state, this.value] = [states.FULFILLED, value];
        setTimeout(()=> {
            while(this.handlers.length > 0){
                this.handle(this.handlers.shift());
            }
        });
    }

    reject(err) {
        [this.state, this.value] = [states.REJECTED, err];
        setTimeout(()=> {
            while(this.handlers.length > 0){
                this.handle(this.handlers.shift());
            }
        });
    }

    getThen(value) {
        let t = typeof value;
        if (value && (t === 'object' || t === 'function')) {
            var then = value.then;
            if (typeof then === 'function') {
                return then;
            }
        }
        return null;
    }

    doResolve(fn, onFulfilled, onRejected) {
        let done = false;
        try {
            fn(function(value) {
                if (done) { return; }
                done = true;
                onFulfilled(value);
            }, function(err) {
                if (done) { return; }
                done = true;
                onRejected(err);
            })
        } catch (err) {
            if (done) { return; }
            done = true;
            onRejected(err);
        }
    }

    resolve(result) {
        if(this === result) {
            this.reject(new TypeError('Promise and x refer to the same object.')); 
        }
        try {
            let then = this.getThen(result);
            if (then) {
                this.doResolve(then.bind(result), this.resolve, this.reject);
                return;
            }
            this.fulfill(result);
        } catch (err) {
            this.reject(err);
        }
    }

    handle(handler) {
        switch(this.state){
            case states.PENDING: 
                this.handlers.push(handler); 
                break;
            case states.FULFILLED: 
                typeof handler.onFulfilled === 'function' && 
                handler.onFulfilled(this.value); 
                break;
            case states.REJECTED: 
                typeof handler.onRejected === 'function' &&
                handler.onRejected(this.value);
        }
    }

    done(onFulfilled, onRejected) {
        setTimeout(() => void this.handle({
            onFulfilled: onFulfilled,
            onRejected: onRejected
        }), 0);
    }

    then(onFulfilled, onRejected) {
        return new AplusPromise((resolveThat, rejectThat) => {
            return this.done(result => {
                if (typeof onFulfilled === 'function') {
                    try {
                        return resolveThat(onFulfilled(result));
                    } catch(err) {
                        return rejectThat(err);
                    }
                } else {
                    return resolveThat(result);
                }
            }, err => {
                if (typeof onRejected === 'function') {
                    try {
                        return resolveThat(onRejected(err));
                    } catch(ex) {
                        return rejectThat(ex);
                    }
                } else {
                    return rejectThat(err);
                }
            });
        });
    }
}

module.exports = {
    resolved: function (value) {
        return new AplusPromise(function (resolve) {
            resolve(value);
        });
    },
    rejected: function (reason) {
        return new AplusPromise(function (resolve, reject) {
            reject(reason);
        });
    },
    deferred: function () {
        var resolve, reject;

        return {
            promise: new AplusPromise(function (rslv, rjct) {
                resolve = rslv;
                reject = rjct;
            }),
            resolve: resolve,
            reject: reject
        };
    }
};
