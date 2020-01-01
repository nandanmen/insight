import * as Syntax from "./Syntax";
import * as Semantics from "./Semantics";
import { InsightDatasetKind } from "./IInsightFacade";

/**
 * Recursively walks through the query to make sure it's well formed.
 * @param query Query object
 * @return string if there is an error, null otherwise
 */
export function validateSyntax(query: any): string {
    try {
        Syntax.validate(query);
    } catch (err) {
        return err.message;
    }
    return null;
}

export function validateSemantics(
    query: any,
    dataset: string,
    kind: InsightDatasetKind,
): string {
    try {
        Semantics.validate(query, dataset, kind);
    } catch (err) {
        return err.message;
    }
    return null;
}
