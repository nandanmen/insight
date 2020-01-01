import { IDataset, InsightDatasetKind } from "../IInsightFacade";

export type Parser<T = InsightDatasetKind> = (
    zip: string,
) => Promise<IDataset<T>>;
