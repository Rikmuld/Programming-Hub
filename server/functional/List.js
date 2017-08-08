"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Tuple_1 = require("./Tuple");
class List {
    match(ifn, ifl) {
        const ref = this;
        return this instanceof Empty ? ifn(ref) : ifl(ref.h, ref.t);
    }
    tail() {
        return this.match(e => e, (x, xs) => xs);
    }
    head(z) {
        return this.match(e => z, (x, xs) => x);
    }
    add(a) {
        return new Cons(a, this);
    }
    addAll(...a) {
        return List.apply(a).append(this);
    }
    foldLeft(z, f) {
        const go = (rest, acc) => {
            return rest.match(e => acc, (x, xs) => go(xs, f(acc, x)));
        };
        return go(this, z);
    }
    foldRight(z, f) {
        return this.reverse().foldLeft(z, (acc, x) => f(x, acc));
    }
    length() {
        return this.foldLeft(0, (acc, a) => acc + 1);
    }
    isEmpty() {
        return this.match(e => true, (x, xs) => false);
    }
    reverse() {
        return this.foldLeft(List.apply([]), (la, a) => la.add(a));
    }
    append(la) {
        return this.foldRight(la, (a, la) => la.add(a));
    }
    prepend(la) {
        return la.append(this);
    }
    get(n) {
        return this.match(() => null, (x, xs) => (n == 0) ? x : xs.get(n - 1));
    }
    map(f) {
        return this.foldRight(List.apply([]), (a, lb) => lb.add(f(a)));
    }
    map2(lb, f) {
        return this.flatMap(a => lb.map(b => f(a, b)));
    }
    filter(f) {
        return this.foldRight(List.apply([]), (a, la) => f(a) ? la.add(a) : la);
    }
    filter2(f) {
        return this.foldRight(new Tuple_1.Tuple(List.apply([]), List.apply([])), (a, tup) => f(a) ? tup.map_1(la => la.add(a)) : tup.map_2(la => la.add(a)));
    }
    flatMap(f) {
        return List.concat(this.map(f));
    }
    zipWith(lb, f) {
        const go = (la, lb, lc = List.apply([])) => {
            if (la.isEmpty() || lb.isEmpty())
                return lc;
            else
                return go(la.tail(), lb.tail(), lc.add(f(la.head(null), lb.head(null))));
        };
        return go(this, lb);
    }
    zip(lb) {
        return this.zipWith(lb, (a, b) => new Tuple_1.Tuple(a, b));
    }
    toArray() {
        return this.foldRight([], (a, aa) => aa.concat(a)).reverse();
    }
    sort(ordering) {
        const array = this.toArray();
        array.sort(ordering);
        return List.apply(array);
    }
}
exports.List = List;
class Empty extends List {
}
exports.Empty = Empty;
class Cons extends List {
    constructor(head, tail) {
        super();
        this.h = head;
        this.t = tail;
    }
}
exports.Cons = Cons;
(function (List) {
    function apply(la) {
        const go = (array, n) => {
            if (n < array.length)
                return new Cons(array[n], go(array, n + 1));
            else
                return new Empty();
        };
        return go(la, 0);
    }
    List.apply = apply;
    function mk(...la) {
        const go = (array, n) => {
            if (n < array.length)
                return new Cons(array[n], go(array, n + 1));
            else
                return new Empty();
        };
        return go(la, 0);
    }
    List.mk = mk;
    function unit(a) {
        return new Cons(a, new Empty());
    }
    List.unit = unit;
    function sum(l) {
        return l.foldLeft(0, (acc, a) => acc + a);
    }
    List.sum = sum;
    //wrong, use below!
    function range(n, from = 0) {
        const go = (left, acc = new Empty) => {
            return left == 0 ? acc : go(left - 1, new Cons(from - n + left, acc));
        };
        return go(n);
    }
    List.range = range;
    function range2(n, from = 0) {
        const go = (left, acc = new Empty) => {
            return left == 0 ? acc : go(left - 1, new Cons(from + left - 1, acc));
        };
        return go(n);
    }
    List.range2 = range2;
    function concat(lla) {
        return lla.foldRight(apply([]), (la, acc_la) => acc_la.append(la));
    }
    List.concat = concat;
    //reame to foreach
    function forall(la, f) {
        la.foldLeft(null, (none, a) => f(a));
    }
    List.forall = forall;
})(List = exports.List || (exports.List = {}));
