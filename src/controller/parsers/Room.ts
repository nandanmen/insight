import { Parser } from "./IParser";
import { InsightDatasetKind, IDataset, InsightError } from "../IInsightFacade";
import * as JSZip from "jszip";
import { assert } from "../../Assert";
import * as Document from "../../Document";
import Log from "../../Util";
import { getLocation } from "../../services/LocationService";
import * as Building from "./Building";

const parse5 = require("parse5");

const ROOT_FOLDER = "rooms";
const ROOT_FILE = "index.htm";

export interface IBuildingMetadata {
    fullname: string;
    shortname: string;
    address: string;
    lat: number;
    lon: number;
}
interface IBuildingFile {
    isValid: boolean;
    filePath?: string;
    error?: string;
    metadata?: IBuildingMetadata;
}

export type BuildingFile = IBuildingFile & { content: string };

export const parse: Parser<InsightDatasetKind.Rooms> = (content) => {
    return JSZip.loadAsync(content, { base64: true })
        .then((zip) => zip.folder(ROOT_FOLDER))
        .then(parseRootFile)
        .then((files) => {
            const dataset = {
                numRows: 0,
                data: [],
            } as IDataset<InsightDatasetKind.Rooms>;

            for (const file of files) {
                const rooms = Building.parse(file);
                if (rooms && rooms.length) {
                    dataset.numRows += rooms.length;
                    rooms.forEach((room) => dataset.data.push(room));
                }
            }

            return dataset;
        })
        .catch((err) => {
            return Promise.reject(new InsightError(err));
        });
};

function parseRootFile(root: JSZip) {
    return root
        .file(ROOT_FILE)
        .async("text")
        .then((html) => {
            const document = parse5.parse(html);
            const rows = getBuildingRows(document);

            if (typeof rows === "string") {
                return Promise.reject(rows);
            }

            if (!rows) {
                return Promise.reject("Failed finding building information");
            }

            const files: Array<Promise<BuildingFile>> = rows
                .filter((row) => row.tagName === "tr")
                .map((row) => {
                    return parseRow(row)
                        .then((building) => {
                            return root
                                .file(building.filePath)
                                .async("text")
                                .then((content) => {
                                    return {
                                        isValid: true,
                                        metadata: building.metadata,
                                        content,
                                    };
                                })
                                .catch((err) => {
                                    Log.error(err);
                                    return { isValid: false, content: "" };
                                });
                        })
                        .catch((err) => {
                            Log.error(err);
                            return { isValid: false, content: "" };
                        });
                });

            return Promise.all(files);
        });
}

function getBuildingRows(document: any): any[] {
    try {
        assert(document);

        const baseClassName = "views-field views-field-field-building";
        const table = Document.findTable(document, [
            (node) =>
                node.tagName === "td" &&
                Document.hasClass(node, `${baseClassName}-code`),
            (node) =>
                node.tagName === "td" &&
                Document.hasClass(node, `views-field views-field-title`),
            (node) =>
                node.tagName === "td" &&
                Document.hasClass(node, `${baseClassName}-address`),
        ]);

        assert(table, "No table found");
        return table.childNodes;
    } catch (err) {
        Log.error(err);
        return err.message;
    }
}

function parseRow(row: any): Promise<IBuildingFile> {
    const codeElement = Document.getElementByClassName(row, "views-field views-field-field-building-code");

    const nameElement = Document
        .getElementByClassName(row, "views-field views-field-title")
        .childNodes.find((node: any) => node.tagName === "a");

    const addressElement = Document
        .getElementByClassName(
            row,
            "views-field views-field-field-building-address"
        );

    if (!codeElement || !nameElement || !addressElement) {
        return Promise.reject({ isValid: false });
    }

    const address = Document.textContent(addressElement);
    const shortname = Document.textContent(codeElement);
    const fullname = Document.textContent(nameElement);

    return getLocation(address)
        .then((location) => {
            return {
                filePath: getFilePath(Document.getAttribute("href", nameElement)),
                isValid: true,
                metadata: {
                    fullname,
                    shortname,
                    address,
                    lat: location.lat,
                    lon: location.lon
                }
            };
        })
        .catch((err) => {
            Log.error(err);
            return Promise.reject({ isValid: false });
        });
}

function getFilePath(path: string) {
    return path.split("./")[1];
}
