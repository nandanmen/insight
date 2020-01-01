import * as http from "http";
import Log from "../Util";

const BASE_URL = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team110`;

interface IGeoResponse {
    lat?: number;
    lon?: number;
    error?: string;
}

export function getLocation(address: string) {
    const url = encodeURI(`${BASE_URL}/${address}`);
    return new Promise<IGeoResponse>((resolve, reject) => {
        http.get(url, (res) => {
            res.setEncoding("utf8");
            res.on("data", (data: string) => {
                const { lat, lon, error } = JSON.parse(data);
                if (error) {
                    reject({ error });
                } else {
                    resolve({ lat, lon });
                }
            });
        });
    });
}
