import { Handler } from "./Server";
import { IInsightFacade } from "../controller/IInsightFacade";

export const performQuery = (controller: IInsightFacade): Handler => (req, res, next) => {
    return controller
        .performQuery(req.params)
        .then((result) => {
            res.json(200, { result });
            return next();
        })
        .catch((error) => {
            res.json(400, { error: error.message });
            return next();
        });
};
