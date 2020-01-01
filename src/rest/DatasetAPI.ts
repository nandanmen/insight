import { Handler } from "./Server";
import InsightFacade from "../controller/InsightFacade";
import Log from "../Util";
import { InsightError } from "../controller/IInsightFacade";

export const getDatasets = (controller: InsightFacade): Handler => (req, res, next) => {
    return controller
        .listDatasets()
        .then((result) => {
            res.json(200, { result });
            return next();
        })
        .catch((error) => {
            res.json(400, { error: error.message });
            return next();
        });
};

export const putDataset = (controller: InsightFacade): Handler => (req, res, next) => {
    const { id, kind } = req.params;
    const dataset: Buffer = req.body;
    return controller
        .addDataset(id, dataset.toString("base64"), kind)
        .then((result) => {
            res.json(200, { result });
            return next();
        })
        .catch((error) => {
            res.json(400, { error: error.message });
            return next();
        });
};

export const deleteDataset = (controller: InsightFacade): Handler => (req, res, next) => {
    const { id } = req.params;
    return controller
        .removeDataset(id)
        .then((result) => {
            res.json(200, { result });
            return next();
        })
        .catch((error) => {
            res.json(error instanceof InsightError ? 400 : 404, { error: error.message });
            return next();
        });
};
