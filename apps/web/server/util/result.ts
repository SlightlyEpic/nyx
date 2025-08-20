type _Result<T, E> = {
    ok: true,
    value: T,
} | {
    ok: false,
    error: E,
};

export class Result<T, E> {
    public r: _Result<T, E>;

    constructor(ok: true, value: T);
    constructor(ok: false, value: E);
    constructor(ok: boolean, value: T | E) {
        if(ok) this.r = { ok, value: value as T };
        else   this.r = { ok, error: value as E };
    }

    static of<T, E>(f: () => T) {
        return {
            withCatch: (g: (_err: unknown) => E): Result<T, E> => {
                try {
                    return new Result(true, f());
                } catch(_err: unknown) {
                    return new Result(false, g(_err));
                }
            }
        };
    }

    unwrap(): T {
        if(!this.r.ok) throw Error("Called Result.unwrap() on an Err value");
        return this.r.value;
    }

    unwrap_or(v: T): T {
        return this.r.ok
            ? this.r.value
            : v;
    }

    unwrap_or_else(f: () => T): T {
        return this.r.ok
            ? this.r.value
            : f();
    }

    expect(msg: string): T {
        if(!this.r.ok) throw Error(msg);
        return this.r.value;
    }

    match<P>(f: {
        Ok(v: T): P,
        Err(e: E): P,
    }): P {
        return this.r.ok
            ? f.Ok(this.r.value)
            : f.Err(this.r.error);
    }

    ok(): boolean {
        return this.r.ok;
    }
}
