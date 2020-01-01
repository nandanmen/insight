import {
    IDataset,
    ISection,
    InsightDatasetKind,
    IRoom,
} from "./controller/IInsightFacade";

export const oneOf = (set: string[]) => (val: any) => set.includes(val);

export const map = (fn: (item: any) => any, index?: number) => (arr: any[]) => arr.map(fn);

export function isFilter(key: string) {
    return (
        isLogic(key) ||
        isMComparator(key) ||
        isSComparator(key) ||
        isNegator(key)
    );
}

export function isApplyKey(key: string) {
    return key.length && !key.includes("_");
}

export const isKeyOf = (kind: InsightDatasetKind) => (key: string) => {
    if (!isKey(key)) {
        return false;
    }
    const field = getFieldFromKey(key);
    return kind === InsightDatasetKind.Courses
        ? isCoursesKey(field)
        : isRoomsKey(field);
};

export const isRoomsKey = oneOf([
    "fullname",
    "shortname",
    "number",
    "name",
    "address",
    "lat",
    "lon",
    "seats",
    "type",
    "furniture",
    "href",
]);

export const isCoursesKey = oneOf([
    "dept",
    "id",
    "avg",
    "instructor",
    "title",
    "pass",
    "fail",
    "audit",
    "uuid",
    "year",
]);

export const isApplyToken = oneOf(["MAX", "MIN", "AVG", "COUNT", "SUM"]);

export const isDirection = oneOf(["UP", "DOWN"]);

export const isLogic = oneOf(["AND", "OR"]);

export const isMComparator = oneOf(["LT", "GT", "EQ"]);

export const isSComparator = oneOf(["IS"]);

export const isNegator = oneOf(["NOT"]);

export function isKey(str: string) {
    return isSKey(str) || isMKey(str);
}

export function isSKey(key: string) {
    const fields = key.split("_");
    if (fields.length !== 2) {
        return false;
    }
    const [id, field] = fields;
    return isIdString(id) && isSField(field);
}

export const isSField = oneOf([
    "dept",
    "id",
    "instructor",
    "title",
    "uuid",
    "fullname",
    "shortname",
    "number",
    "name",
    "address",
    "type",
    "furniture",
    "href",
]);

export function isMKey(key: string) {
    const fields = key.split("_");
    if (fields.length !== 2) {
        return false;
    }
    const [id, field] = fields;
    return isIdString(id) && isMField(field);
}

export const isMField = oneOf([
    "avg",
    "pass",
    "fail",
    "audit",
    "year",
    "lat",
    "lon",
    "seats",
]);

export function isIdString(key: string) {
    if (!key) {
        return false;
    }
    if (key.indexOf("_") >= 0) {
        return false;
    }
    if (!key.trim().length) {
        return false;
    }
    return true;
}

export function isObject(obj: any) {
    return typeof obj === "object" && !Array.isArray(obj);
}

export function isValidInputString(input: string) {
    return !input.split("").includes("*");
}

export function assertKeyLength(obj: any, length: number) {
    const keys = Object.keys(obj);
    if (keys.length !== length) {
        throw new Error(`Failed assertion: Object has length ${keys.length}`);
    }
    return keys;
}

export function hasDuplicates(arr: any[]) {
    return new Set(arr).size !== arr.length;
}

export function getDataset(columns: string[]) {
    const key = columns[0];
    return getDatasetFromKey(key);
}

export function getDatasetFromKey(key: string) {
    return key.split("_")[0];
}

export function getFieldFromKey(key: string) {
    return key.split("_")[1];
}

export function getOnlyKeyVal(obj: any) {
    const entries = Object.entries(obj);
    return entries[0];
}

export function isEmpty(obj: any) {
    return Object.entries(obj).length === 0;
}

export const pickKeys = (...keys: string[]) => (obj: any): any => {
    const result: any = {};
    keys.forEach((key) => {
        result[key] = obj[key];
    });
    return result;
};

export const attachDatasetId = (id: string) => (obj: any) => {
    const result: any = {};
    for (const key of Object.keys(obj)) {
        const newKey = `${id}_${key}`;
        result[newKey] = obj[key];
    }
    return result;
};

export function getIdentifier(item: ISection | IRoom) {
    return item.uuid || item.name;
}

export function getKeyType(key: string) {
    const section: ISection = {
        dept: "",
        id: "",
        title: "",
        avg: 0,
        instructor: "",
        pass: 0,
        fail: 0,
        audit: 0,
        uuid: "",
        year: 0,
    };
    const room: IRoom = {
        fullname: "",
        shortname: "",
        number: "",
        name: "",
        address: "",
        lat: 0,
        lon: 0,
        seats: 0,
        type: "",
        furniture: "",
        href: ""
    };
    return section[key] !== undefined ? typeof section[key] : typeof room[key];
}

export function pipe<T>(...fns: Array<(x: T) => T>) {
    return (x: T) => fns.reduce((v, f) => f(v), x);
}
