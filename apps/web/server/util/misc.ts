export function omit<T extends object, U extends (keyof T)[]>(
    obj: T, keys: U
): Omit<T, U[number]> {
    const o = { ...obj };
    for(const key of keys) {
        delete o[key];
    }
    return o;
}
