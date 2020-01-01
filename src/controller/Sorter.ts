import { IOrder } from "./IInsightFacade";
import { getKeyType, getFieldFromKey } from "../Helpers";

export function sort(order: IOrder, results: any[]): any[] {
    if (typeof order === "string") {
        results.sort(buildComparator([order], "UP"));
        return results;
    }
    const { dir, keys } = order;
    results.sort(buildComparator(keys, dir));
    return results;
}

function buildComparator(keys: string[], dir: "UP" | "DOWN") {
    return (a: any, b: any) => comparatorHelper(keys, dir, a, b);
}

function comparatorHelper(keys: string[], dir: "UP" | "DOWN", a: any, b: any): number {
    const key = keys[0];
    const type = getKeyType(getFieldFromKey(key));

    const first = type === "string" ? a[key].toLowerCase() : a[key];
    const second = type === "string" ? b[key].toLowerCase() : b[key];

    if (first < second) {
        return dir === "UP" ? -1 : 1;
    }
    if (first > second) {
        return dir === "UP" ? 1 : -1;
    }
    if (keys.slice(1).length) {
        return comparatorHelper(keys.slice(1), dir, a, b);
    }
    return 0;
}
