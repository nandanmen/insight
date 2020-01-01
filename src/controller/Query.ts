import {
    IDataset,
    ISection,
    ResultTooLargeError,
    InsightDatasetKind,
    IOrder,
} from "./IInsightFacade";
import * as Validator from "./Validate";
import * as Transformer from "./Transformer";
import * as Sorter from "./Sorter";
import {
    getDataset,
    getFieldFromKey,
    pickKeys,
    attachDatasetId,
    getKeyType,
    pipe,
    isKey,
    isSField,
} from "../Helpers";
import { resolve } from "./Resolver";
import Log from "../Util";

export interface IQueryOptions {
    columns: string[];
    order?: string;
}

export interface ITransformation {
    group: string[];
    apply: any[];
}

export interface IParsedQuery {
    id: string;
    body: any;
    options: IQueryOptions;
    transformation?: ITransformation;
}

export function validate(query: any): string {
    return Validator.validateSyntax(query);
}

export function check(query: any, id: string, kind: InsightDatasetKind) {
    return Validator.validateSemantics(query, id, kind);
}

/**
 * Fetches information relevant to the evaluation step from
 * the query object.
 * @param query Query object
 */
export function fetch(query: any): IParsedQuery {
    const result: IParsedQuery = {
        id: "",
        body: {},
        options: {
            columns: [],
        }
    };

    const id = getDatasetId(query);
    const { WHERE, OPTIONS, TRANSFORMATIONS } = query;
    const { COLUMNS, ORDER } = OPTIONS;

    result.id = id;
    result.body = WHERE;
    result.options.columns = COLUMNS;
    result.options.order = ORDER;

    if (TRANSFORMATIONS) {
        const { GROUP, APPLY } = TRANSFORMATIONS;
        const transformation = {
            group: GROUP,
            apply: APPLY
        };
        result.transformation = transformation;
    }

    return result;
}

const RESULTS_MAX_SIZE = 5000;

/**
 * Evaluates the query against a given dataset object.
 * Assumes body is well formed.
 * @param dataset Dataset to search into, in JSON format
 * @param body Parsed query body
 * @param options Parsed query options
 */
export function evaluate(
    dataset: IDataset,
    body: any,
    options: IQueryOptions,
    transformation?: ITransformation,
): Promise<any[]> {
    const getResults = pipe(
        resolve(dataset),
        aggregate(transformation)
    );

    const formatResults = pipe(
        select(options.columns, dataset.id),
        sort(options.order)
    );

    const results = getResults(body);
    if (results.length > RESULTS_MAX_SIZE) {
        return Promise.reject(new ResultTooLargeError());
    }

    return Promise.resolve(formatResults(results));
}

function aggregate(transformation: any) {
    return (data: any[]) => {
        if (!transformation) {
            return data;
        }
        const groupFields = transformation.group.map(getFieldFromKey);
        const groups = groupItems(groupFields, data);
        return apply(transformation.apply, groups, transformation.group);
    };
}

function groupItems(groups: string[], data: any[]): any[][] {
    const result: any = {};
    data.forEach((item) => {
        const itemKey = serialize(groups, item);
        if (!result.hasOwnProperty(itemKey)) {
            result[itemKey] = [];
        }
        result[itemKey].push(item);
    });
    return Object.values(result);
}

function serialize(keys: string[], obj: any) {
    const result: any[] = [];
    keys.forEach((key) => {
        result.push(obj[key]);
    });
    return result.join("-");
}

function apply(rules: any[], groups: any[][], groupKeys: string[]) {
    const keys = groupKeys.map(getFieldFromKey);
    if (!rules.length) {
        return groups.map((group) => group[0]).map(pickKeys(...keys));
    }
    return Transformer.performAggregation(rules, groups, keys);
}

function select(columns: string[], datasetId: string) {
    return (data: any[]) => {
        return data.map((item) => {
            const result: any = {};
            columns.forEach((key) => {
                const itemKey = isKey(key) ? getFieldFromKey(key) : key;
                result[key] = item[itemKey];
            });
            return result;
        });
    };
}

function sort(order: IOrder) {
    return (data: any[]) => {
        if (!order) {
            return data;
        }
        return Sorter.sort(order, data);
    };
    /* {
        if (!order) {
            return data;
        }
        const type = getKeyType(getFieldFromKey(order));
        if (type === "string") {
            data.sort((a, b) => {
                const first = a[order].toLowerCase();
                const second = b[order].toLowerCase();
                if (first < second) {
                    return -1;
                }
                if (first > second) {
                    return 1;
                }
                return 0;
            });
        } else {
            data.sort((a, b) => {
                const first = a[order];
                const second = b[order];
                return first - second;
            });
        }
        return data;
    }; */
}

/**
 * Returns the dataset id used in the query. Assumes the query is
 * well formed i.e. all keys use the same dataset id.
 * @param query Query object
 * @return dataset id
 */
function getDatasetId(query: any): string {
    return getDataset(query.OPTIONS.COLUMNS);
}
