import {
    IDataset,
    InsightDatasetKind,
    InsightError,
} from "./IInsightFacade";
import * as Course from "./parsers/Course";
import * as Room from "./parsers/Room";
import { Parser } from "./parsers/IParser";

const parsers: Record<InsightDatasetKind, Parser> = {
    [InsightDatasetKind.Courses]: Course.parse,
    [InsightDatasetKind.Rooms]: Room.parse,
};

function getParser(kind: InsightDatasetKind) {
    return parsers[kind] as Parser<typeof kind>;
}

export function parse(
    id: string,
    zip: string,
    kind: InsightDatasetKind,
): Promise<IDataset<typeof kind>> {
    const parser = getParser(kind);
    return parser(zip).then((dataset) => {
        dataset.id = id;
        dataset.kind = kind;

        if (!dataset.numRows) {
            return Promise.reject(
                new InsightError("Dataset did not contain a valid section"),
            );
        }

        return dataset;
    });
}
