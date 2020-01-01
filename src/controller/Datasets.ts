import * as fs from "fs-extra";
import { IDataset, InsightDataset } from "./IInsightFacade";

const FILE_PATH = `data`;

/**
 * Storage and manipulation of datasets, with cache.
 */
export default class Datasets {
    private cache: Map<string, IDataset>;
    private datasets: Set<string>;

    constructor() {
        this.cache = new Map();
        this.datasets = new Set();

        const files = fs.readdirSync(FILE_PATH);
        for (const file of files) {
            const id = file.split(".json")[0];
            this.datasets.add(id);
        }
    }

    public get(id: string): Promise<IDataset> {
        if (this.cache.has(id)) {
            return Promise.resolve(this.cache.get(id));
        }
        return this.readDataset(id).then((dataset) => {
            this.cache.set(id, dataset);
            return dataset;
        });
    }

    public add(id: string, value: IDataset): Promise<string[]> {
        this.datasets.add(id);
        return this.saveDataset(id, value).then(() => {
            return [...this.datasets.keys()];
        });
    }

    public has(id: string) {
        return this.datasets.has(id);
    }

    public remove(id: string): Promise<string> {
        this.datasets.delete(id);
        if (this.cache.has(id)) {
            this.cache.delete(id);
        }
        return this.removeDataset(id);
    }

    public list(): Promise<InsightDataset[]> {
        const datasets = [...this.datasets.keys()].map((key) => {
            return this.readDataset(key);
        });

        return Promise.all(datasets).then((values) => {
            return values.map((val) => {
                const { id, kind, numRows } = val;
                return { id, kind, numRows };
            });
        });
    }

    private readDataset(id: string): Promise<IDataset> {
        return fs.readJSON(`${FILE_PATH}/${id}.json`);
    }

    private saveDataset(id: string, value: IDataset): Promise<string> {
        return fs.writeJSON(`${FILE_PATH}/${id}.json`, value).then(() => {
            return id;
        });
    }

    private removeDataset(id: string): Promise<string> {
        return fs.remove(`${FILE_PATH}/${id}.json`).then(() => {
            return id;
        });
    }
}
