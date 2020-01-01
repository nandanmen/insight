import { InsightDatasetKind } from "./IInsightFacade";
import { assert } from "../Assert";
import {
    hasDuplicates,
    isKey,
    getDatasetFromKey,
    oneOf,
    isMKey,
    isKeyOf,
    isMComparator,
    isSComparator,
    isLogic,
    isEmpty,
} from "../Helpers";

const isNumericOperator = oneOf(["MAX", "MIN", "AVG", "SUM"]);

export function validate(
    query: any,
    dataset: string,
    kind: InsightDatasetKind,
) {
    const { WHERE, OPTIONS, TRANSFORMATIONS } = query;
    if (TRANSFORMATIONS) {
        validateTransformationsSemantics(TRANSFORMATIONS, dataset, kind);
    }
    validateOptionsSemantics(OPTIONS, TRANSFORMATIONS, dataset, kind);
    if (!isEmpty(WHERE)) {
        validateFilterSemantics(WHERE, dataset, kind);
    }
}

function validateFilterSemantics(
    filter: any,
    dataset: string,
    kind: InsightDatasetKind,
) {
    const [key, value] = Object.entries(filter)[0];
    if (isMComparator(key) || isSComparator(key)) {
        checkDataset(value, dataset, kind);
    } else if (isLogic(key)) {
        (value as any[]).forEach((logicFilter) =>
            validateFilterSemantics(logicFilter, dataset, kind),
        );
    } else {
        validateFilterSemantics(value, dataset, kind);
    }
}

function checkDataset(obj: any, dataset: string, kind: InsightDatasetKind) {
    const key = Object.keys(obj)[0];
    assert(
        getDatasetFromKey(key) === dataset,
        "Invalid key: Different datasets",
    );
    assert(isKeyOf(kind)(key), "Invalid key: Incorrect kind");
}

function validateTransformationsSemantics(
    transformations: any,
    dataset: string,
    kind: InsightDatasetKind,
) {
    const { APPLY } = transformations;
    const keys = APPLY.map((applyRule: any) => Object.keys(applyRule)[0]);
    assert(!hasDuplicates(keys), "Invalid APPLY: Duplicate APPLYRULEs");

    APPLY.forEach((applyRule: any) => {
        const value = Object.values(applyRule)[0];
        const [applyToken, key] = Object.entries(value)[0];

        assert(
            getDatasetFromKey(key) === dataset,
            "Invalid APPLYRULE: Keys do not reference the same dataset",
        );
        assert(
            isKeyOf(kind)(key),
            "Invalid APPLYRULE: Key refers to a different dataset kind",
        );
        if (isNumericOperator(applyToken)) {
            assert(
                isMKey(key),
                "Invalid APPLYRULE: Numeric operator called on non-numeric key",
            );
        }
    });
}

function validateOptionsSemantics(
    options: any,
    transformations: any,
    dataset: string,
    kind: InsightDatasetKind,
) {
    const groupAndApplyKeys = getGroupAndApplyKeys(transformations);
    const { COLUMNS, ORDER } = options;
    validateColumnsSemantics(COLUMNS, groupAndApplyKeys, dataset, kind);
    if (ORDER) {
        validateOrderSemantics(ORDER, COLUMNS);
    }
}

function validateColumnsSemantics(
    columns: string[],
    keySet: string[],
    dataset: string,
    kind: InsightDatasetKind,
) {
    assert(!hasDuplicates(columns), "Invalid COLUMNS: Duplicate keys");

    const keys = columns.filter(isKey);
    if (!keySet) {
        assert(keys.length === columns.length, "Invalid COLUMNS: Some elements are not keys");
    }
    assert(
        keys.every((key) => getDatasetFromKey(key) === dataset),
        "Invalid COLUMNS: Keys do not reference the same dataset",
    );
    assert(
        keys.every(isKeyOf(kind)),
        "Invalid COLUMNS: Keys refer to different kind",
    );

    if (keySet) {
        assert(
            columns.every((keyOrApplyKey) => keySet.includes(keyOrApplyKey)),
            "Invalid COLUMNS: Keys are not in GROUP or APPLY",
        );
    }
}

function validateOrderSemantics(order: any, columns: string[]) {
    if (typeof order === "string") {
        assert(
            columns.includes(order),
            "Invalid ORDER: ORDERKEY not in COLUMNS",
        );
    } else {
        const { keys } = order;
        assert(
            keys.every((key: string) => columns.includes(key)),
            "Invalid ORDER: ORDERKEY(s) not in COLUMNS",
        );
    }
}

function getGroupAndApplyKeys(transformations: any): string[] {
    if (!transformations) {
        return null;
    }
    const { GROUP, APPLY } = transformations;
    const result = [...GROUP];
    APPLY.forEach((applyRule: any) => {
        const applyKey = Object.keys(applyRule)[0];
        result.push(applyKey);
    });
    return result;
}
