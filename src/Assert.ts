export function assert(val: any, message = "Assertion failed") {
    if (!Boolean(val)) {
        throw new Error(message);
    }
}

export function assertKeyLength(
    length: number | number[],
    val: any,
    message = "Assertion failed",
) {
    const keys = Object.keys(val);
    if (typeof length === "number") {
        assert(keys.length === length, message);
    } else {
        assert(length.includes(keys.length), message);
    }
}
