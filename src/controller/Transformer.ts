import { Decimal } from "decimal.js";
import { pickKeys, getFieldFromKey } from "../Helpers";

type Operator = "COUNT" | "MIN" | "MAX" | "SUM" | "AVG";

type Aggregator = (group: any[], field: string) => any;

const performCount: Aggregator = (group, field) => {
    const seen = new Set();
    group.forEach((item) => seen.add(item[field]));
    return seen.size;
};

const performAverage: Aggregator = (group, field) => {
    const total = group.reduce((sumSoFar, item) => {
        const num = item[field];
        return new Decimal(num).add(new Decimal(sumSoFar));
    }, 0);
    return Number((total.toNumber() / group.length).toFixed(2));
};

const performSum: Aggregator = (group, field) => {
    const total = group.reduce((sumSoFar, item) => {
        const num = item[field];
        return num + sumSoFar;
    }, 0);
    return Number(total.toFixed(2));
};

const performMin: Aggregator = (group, field) => {
    return Math.min(...group.map((item) => item[field]));
};

const performMax: Aggregator = (group, field) => {
    return Math.max(...group.map((item) => item[field]));
};

const resolvers: Record<Operator, Aggregator> = {
    COUNT: performCount,
    MIN: performMin,
    MAX: performMax,
    AVG: performAverage,
    SUM: performSum
};

export function performAggregation(rules: any[], groups: any[][], keys: string[]) {
    return groups.map((group) => {
        const item = pickKeys(...keys)(group[0]);
        rules.forEach((rule) => {
            const [key, result] = performSingleAggregation(rule, group);
            item[key] = result;
        });
        return item;
    });
}

function performSingleAggregation(rule: any, group: any[]) {
    const [key, applyRule] = Object.entries(rule)[0];
    const [operation, field] = Object.entries(applyRule)[0];
    const aggregator = resolvers[operation as Operator];
    return [key, aggregator(group, getFieldFromKey(field))];
}
