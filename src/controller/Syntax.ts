import { assert, assertKeyLength } from "../Assert";
import * as Helpers from "../Helpers";

export function validate(query: any) {
    assert(Helpers.isObject(query), "Not an object");

    const { WHERE, OPTIONS, TRANSFORMATIONS } = query;
    const keys = Object.keys(query);
    assert(keys.length, "Empty query");
    assert(WHERE, "Missing WHERE");
    assert(OPTIONS, "Missing OPTIONS");

    if (TRANSFORMATIONS) {
        assert(keys.length === 3, "Too many keys");
        validateTransformationsSyntax(TRANSFORMATIONS);
    } else {
        assert(keys.length === 2, "Too many keys");
    }

    validateOptionsSyntax(OPTIONS);
    validateWhereSyntax(WHERE);
}

function validateTransformationsSyntax(transformations: any) {
    assert(
        Helpers.isObject(transformations),
        "Invalid TRANSFORMATIONS: Not an Object",
    );
    assertKeyLength(
        2,
        transformations,
        "Invalid TRANSFORMATIONS: Unexpected number of keys",
    );
    const { GROUP, APPLY } = transformations;
    validateGroupSyntax(GROUP);
    validateApplySyntax(APPLY);
}

function validateGroupSyntax(group: any) {
    assert(group, "Missing GROUP");
    assert(Array.isArray(group), "Invalid GROUP: Not an array");
    assert(group.length, "Invalid GROUP: Empty array");
    assert(
        group.every(Helpers.isKey),
        "Invalid GROUP: Some entries aren't keys",
    );
}

function validateApplySyntax(apply: any) {
    assert(apply, "Missing APPLY");
    assert(Array.isArray(apply), "Invalid APPLY: Not an array");
    apply.forEach(validateApplyRuleSyntax);
}

function validateApplyRuleSyntax(applyRule: any) {
    assert(Helpers.isObject(applyRule), "Invalid APPLYRULE: Not an object");
    assertKeyLength(
        1,
        applyRule,
        "Invalid APPLYRULE: Unexpected number of keys",
    );

    const [applyKey, applyRuleValue] = Object.entries(applyRule)[0];
    assert(
        Helpers.isApplyKey(applyKey),
        "Invalid APPLYRULE: Key not an applykey",
    );
    assert(
        Helpers.isObject(applyRuleValue),
        "Invalid APPLYRULE: Value not an object",
    );
    assertKeyLength(
        1,
        applyRuleValue,
        "Invalid APPLYRULE: Unexpected number of keys in value",
    );

    const [applytoken, key] = Object.entries(applyRuleValue)[0];
    assert(
        Helpers.isApplyToken(applytoken),
        "Invalid APPLYRULE: Value key not an applytoken",
    );
    assert(Helpers.isKey(key), "Invalid APPLYRULE: Inner value not a key");
}

function validateOptionsSyntax(options: any) {
    assert(Helpers.isObject(options), "Invalid OPTIONS: Not an object");

    const keys = Object.keys(options);
    assert(keys.length, "Invalid OPTIONS: Empty options");
    assert(keys.includes("COLUMNS"), "Invalid OPTIONS: Missing COLUMNS");

    const { COLUMNS, ORDER } = options;
    if (ORDER) {
        assert(keys.length === 2, "Invalid OPTIONS: Too many keys");
        validateSortSyntax(ORDER);
    } else {
        assert(keys.length === 1, "Invalid OPTIONS: Too many keys");
    }
    validateColumnsSyntax(COLUMNS);
}

function validateColumnsSyntax(columns: any) {
    assert(Array.isArray(columns), "Invalid COLUMNS: Not an array");
    assert(columns.length, "Invalid COLUMNS: Empty array");
    assert(
        columns.every((keyOrApplykey: any) => {
            assert(
                typeof keyOrApplykey === "string",
                "Invalid COLUMNS: Some keys aren't strings",
            );
            return (
                Helpers.isKey(keyOrApplykey) ||
                Helpers.isApplyKey(keyOrApplykey)
            );
        }),
        "Invalid COLUMNS: Some keys aren't keys or apply keys",
    );
}

function validateSortSyntax(sort: any) {
    const isOrderKey = (key: string) =>
        Helpers.isKey(key) || Helpers.isApplyKey(key);

    if (typeof sort === "string") {
        assert(isOrderKey(sort), "Invalid SORT: Not an object or ORDERKEY");
    } else {
        assert(
            Helpers.isObject(sort),
            "Invalid SORT: Not an object or ORDERKEY",
        );
        assertKeyLength(2, sort, "Invalid SORT: Unexpected key length");

        const { dir, keys } = sort;
        assert(Helpers.isDirection(dir), "Invalid dir: Not a DIRECTION");
        assert(Array.isArray(keys), "Invalid keys: Not an array");
        assert(keys.length, "Invalid keys: Empty array");
        assert(
            keys.every(isOrderKey),
            "Invalid keys: Some keys aren't ORDERKEYs",
        );
    }
}

function validateWhereSyntax(where: any) {
    assert(Helpers.isObject(where), "Invalid WHERE: Not an object");
    assertKeyLength([0, 1], where, "Invalid WHERE: Unexpected number of keys");

    if (Object.keys(where).length) {
        validateFilterSyntax(where);
    }
}

function validateFilterSyntax(filter: any) {
    assertKeyLength(1, filter, "Invalid FILTER: Too many keys");

    const [filterKey, filterValue] = Object.entries(filter)[0];
    assert(Helpers.isFilter(filterKey), "Invalid FILTER: Key not a filter");

    if (Helpers.isLogic(filterKey)) {
        validateLogicSyntax(filterValue);
    } else if (Helpers.isMComparator(filterKey)) {
        validateMComparisonSyntax(filterValue);
    } else if (Helpers.isSComparator(filterKey)) {
        validateSComparisonSyntax(filterValue);
    } else {
        validateFilterSyntax(filterValue);
    }
}

function validateLogicSyntax(logic: any) {
    assert(Array.isArray(logic), "Invalid LOGIC: Not an array");
    assert(logic.length, "Invalid LOGIC: Empty array");
    assert(
        logic.every(Helpers.isObject),
        "Invalid LOGIC: Some items are not objects",
    );
    logic.forEach(validateFilterSyntax);
}

function validateMComparisonSyntax(mcomparison: any) {
    assert(Helpers.isObject(mcomparison), "Invalid MCOMPARISON: Not an object");
    assertKeyLength(
        1,
        mcomparison,
        "Invalid MCOMPARISON: Unexpected number of keys",
    );

    const [mkey, value] = Object.entries(mcomparison)[0];
    assert(Helpers.isMKey(mkey), "Invalid MCOMPARISON: Not an mkey");
    assert(typeof value === "number", "Invalid MCOMPARISON: Not a number");
}

function validateSComparisonSyntax(scomparison: any) {
    assert(Helpers.isObject(scomparison), "Invalid SCOMPARISON: Not an object");
    assertKeyLength(
        1,
        scomparison,
        "Invalid SCOMPARISON: Unexpected number of keys",
    );

    const [skey, value] = Object.entries(scomparison)[0];
    assert(Helpers.isSKey(skey), "Invalid SCOMPARISON: Not an skey");
    assert(typeof value === "string", "Invalid SCOMPARISON: Not a string");

    const originalValue = value as string;
    let input = value as string;
    // get rid of asterisks
    if (originalValue[0] === "*") {
        input = input.slice(1);
    }
    if (originalValue[originalValue.length - 1] === "*") {
        input = input.slice(0, input.length - 1);
    }

    assert(
        Helpers.isValidInputString(input),
        "Invalid SCOMPARISON: Invalid input",
    );
}
