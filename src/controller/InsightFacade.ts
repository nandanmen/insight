import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
} from "./IInsightFacade";
import { InsightError, NotFoundError } from "./IInsightFacade";
import Datasets from "./Datasets";
import * as Query from "./Query";
import * as Zip from "./Zip";
import * as Helpers from "../Helpers";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private datasets: Datasets;

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
        this.datasets = new Datasets();
    }

    public addDataset(
        id: string,
        content: string,
        kind: InsightDatasetKind,
    ): Promise<string[]> {
        if (!Helpers.isIdString(id)) {
            return Promise.reject(new InsightError("Invalid dataset id"));
        }
        if (this.datasets.has(id)) {
            return Promise.reject(
                new InsightError(`Dataset with id: ${id} already exists`),
            );
        }

        return Zip.parse(id, content, kind).then((dataset) => {
            return this.datasets.add(id, dataset);
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!Helpers.isIdString(id)) {
            return Promise.reject(new InsightError("Invalid dataset id"));
        }
        if (!this.datasets.has(id)) {
            return Promise.reject(
                new NotFoundError(`Dataset with id: ${id} does not exist`),
            );
        }
        return this.datasets.remove(id).catch((err) => {
            return Promise.reject(new InsightError(err.message));
        });
    }

    public performQuery(query: any): Promise<any[]> {
        const errorMessage = Query.validate(query);
        if (errorMessage) {
            return Promise.reject(new InsightError(errorMessage));
        }

        const { body, id, options, transformation } = Query.fetch(query);

        if (!this.datasets.has(id)) {
            return Promise.reject(
                new InsightError("Specified dataset does not exist"),
            );
        }
        return this.datasets
            .get(id)
            .then((dataset) => {
                const message = Query.check(query, dataset.id, dataset.kind);
                if (message) {
                    return Promise.reject(new InsightError(message));
                }
                return Promise.resolve(dataset);
            })
            .then((dataset) => {
                return Query.evaluate(dataset, body, options, transformation);
            });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return this.datasets.list();
    }
}
