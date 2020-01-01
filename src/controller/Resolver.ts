import {
    getOnlyKeyVal,
    getFieldFromKey,
    isLogic,
    isMComparator,
    isSComparator,
    isEmpty,
    getIdentifier,
} from "../Helpers";
import { IDataset } from "./IInsightFacade";
import Log from "../Util";

type Resolver = (sections: any[], key: string, value: any) => any[];

export const resolve = (dataset: IDataset) => (query: any) => {
    const { data } = dataset;
    if (isEmpty(query)) {
        return data;
    }

    const [filterKey, value] = Object.entries(query)[0];
    const results = resolveFilter(data, filterKey, value);
    return results;
};

const resolveFilter: Resolver = (sections, key, value) => {
    if (isLogic(key)) {
        return resolveLogic(sections, key, value);
    }
    if (isMComparator(key)) {
        return resolveMComparator(sections, key, value);
    }
    if (isSComparator(key)) {
        return resolveSComparator(sections, key, value);
    }
    return resolveNegation(sections, key, value);
};

const resolveLogic: Resolver = (sections, logic, value) => {
    const results = value.map((filter: any) => {
        const [key, val] = getOnlyKeyVal(filter);
        return resolveFilter(sections, key, val);
    });

    if (logic === "AND") {
        return intersection(...results);
    }
    return union(...results);
};

const union = (...results: any[][]) => {
    return results.reduce((acc, result) => {
        const firstSet = new Set(acc.map(getIdentifier));
        const unionArr = [...acc];
        result.forEach((section) => {
            if (!firstSet.has(getIdentifier(section))) {
                unionArr.push(section);
            }
        });
        return unionArr;
    }, []);
};

const intersection = (...results: any[][]) => {
    return results.reduce((acc, sections) => {
        return acc.filter((section) =>
            Boolean(sections.find((s) => getIdentifier(s) === getIdentifier(section))),
        );
    });
};

const resolveSComparator: Resolver = (sections, _, value) => {
    const [rawKey, input] = getOnlyKeyVal(value);
    const skey = getFieldFromKey(rawKey);
    return sections.filter(filterSectionByInput(input as string, skey));
};

const filterSectionByInput = (input: string, skey: string) => (
    section: any,
) => {
    // e.g. *ps*
    if (input.startsWith("*") && input.endsWith("*")) {
        return section[skey].indexOf(input.slice(1, input.length - 1)) >= 0;
    }
    // e.g. *psc
    if (input.startsWith("*") && !input.endsWith("*")) {
        return section[skey].endsWith(input.slice(1));
    }
    // e.g. cps*
    if (!input.startsWith("*") && input.endsWith("*")) {
        const asterisksIndex = input.indexOf("*");
        return section[skey].startsWith(input.slice(0, asterisksIndex));
    }
    // e.g. cpsc
    return section[skey] === input;
};

const resolveMComparator: Resolver = (sections, key, value) => {
    const [rawKey, mvalue] = getOnlyKeyVal(value);
    const mkey = getFieldFromKey(rawKey);
    const resolvers: Record<string, Resolver> = {
        LT: resolveLT,
        GT: resolveGT,
        EQ: resolveEQ,
    };
    const mresolver = resolvers[key];
    return mresolver(sections, mkey, mvalue);
};

const resolveLT: Resolver = (sections, key, value) => {
    return sections.filter((section: any) => {
        return section[key] < value;
    });
};

const resolveGT: Resolver = (sections, key, value) => {
    return sections.filter((section: any) => {
        return section[key] > value;
    });
};

const resolveEQ: Resolver = (sections, key, value) => {
    return sections.filter((section: any) => {
        return section[key] === value;
    });
};

const resolveNegation: Resolver = (sections, _, value) => {
    const [filterKey, filterValue] = getOnlyKeyVal(value);
    const results = resolveFilter(sections, filterKey, filterValue);
    return negation(sections, results);
};

const negation = (source: any[], other: any[]) => {
    const firstIds = new Set(source.map(getIdentifier));
    const otherIds = new Set(other.map(getIdentifier));
    const difference = new Set();
    firstIds.forEach((id) => {
        if (!otherIds.has(id)) {
            difference.add(id);
        }
    });
    return source.filter((section) => difference.has(getIdentifier(section)));
};
