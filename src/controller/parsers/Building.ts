import { BuildingFile, IBuildingMetadata } from "./Room";
import * as Document from "../../Document";
import { IRoom } from "../IInsightFacade";
import Log from "../../Util";

const parse5 = require("parse5");

export function parse(file: BuildingFile): IRoom[] {
    if (!file.isValid) {
        return [];
    }

    const document = parse5.parse(file.content);
    const roomsTable = getTable(document);

    if (!roomsTable) {
        return [];
    }

    const rawRooms: any[] = roomsTable.childNodes.filter((node: any) => node.tagName === "tr");

    const rooms = [];
    for (const rawRoom of rawRooms) {
        const room = parseRoom(rawRoom, file.metadata);
        if (room) {
            rooms.push(room);
        }
    }
    return rooms;
}

function getTable(document: any) {
    const baseClass = "views-field views-field";
    const classes = [
        "field-room-number",
        "field-room-capacity",
        "field-room-furniture",
        "field-room-type",
        "nothing"
    ];
    return Document
        .findTable(document, classes.map(
            (className) => (node) =>
                node.tagName === "td" &&
                Document.hasClass(node, `${baseClass}-${className}`)
        ));
}

function parseRoom(rawRoom: any, metadata: IBuildingMetadata): IRoom {
    const numberEl = Document
        .getElementByClassName(rawRoom, "views-field views-field-field-room-number")
        .childNodes.find((node: any) => node.tagName === "a");

    const capacityEl = Document.getElementByClassName(rawRoom, "views-field views-field-field-room-capacity");

    const furnitureEl = Document.getElementByClassName(rawRoom, "views-field views-field-field-room-furniture");

    const typeEl = Document.getElementByClassName(rawRoom, "views-field views-field-field-room-type");

    const hrefEl = Document
        .getElementByClassName(rawRoom, "views-field views-field-nothing")
        .childNodes.find((node: any) => node.tagName === "a");

    if (!numberEl || !capacityEl || !furnitureEl || !typeEl || !hrefEl) {
        return null;
    }

    return {
        ...metadata,
        number: Document.textContent(numberEl),
        name: getRoomName(metadata.shortname, Document.textContent(numberEl)),
        seats: Number(Document.textContent(capacityEl)),
        type: Document.textContent(typeEl),
        furniture: Document.textContent(furnitureEl),
        href: Document.getAttribute("href", hrefEl)
    };

}

function getRoomName(building: string, roomNumber: string) {
    return `${building}_${roomNumber}`;
}
