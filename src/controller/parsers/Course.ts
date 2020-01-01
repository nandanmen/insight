import { Parser } from "./IParser";
import * as JSZip from "jszip";
import {
    InsightError,
    IDataset,
    ISection,
    InsightDatasetKind,
} from "../IInsightFacade";

const keyMap: { [key: string]: string } = {
    Audit: "audit",
    Avg: "avg",
    Fail: "fail",
    id: "uuid",
    Pass: "pass",
    Professor: "instructor",
    Subject: "dept",
    Title: "title",
    Year: "year",
    Course: "id",
};

export const parse: Parser<InsightDatasetKind.Courses> = (content) => {
    return JSZip.loadAsync(content, { base64: true })
        .then((zip) => {
            return zip.folder("courses");
        })
        .then((courses) => {
            const files: Array<Promise<{ name: string; content: string }>> = [];
            courses.forEach((relativePath, course) => {
                files.push(
                    course.async("text").then((text) => {
                        return { name: relativePath, content: text };
                    }),
                );
            });
            if (!files.length) {
                return Promise.reject(new InsightError("Empty courses folder"));
            }
            return Promise.all(files);
        })
        .then((files) => {
            const dataset = {
                numRows: 0,
                data: []
            } as IDataset<InsightDatasetKind.Courses>;

            for (const file of files) {
                const sections = parseFile(file);
                if (sections && sections.length) {
                    dataset.numRows += sections.length;
                    sections.forEach((section) => dataset.data.push(section));
                }
            }

            return dataset;
        })
        .catch((err) => {
            return Promise.reject(new InsightError(err));
        });
};

function parseFile(file: { name: string; content: string }): ISection[] {
    let rawFileObj;
    try {
        rawFileObj = JSON.parse(file.content);
    } catch (err) {
        return [];
    }
    if (!rawFileObj.hasOwnProperty("result")) {
        return [];
    }
    let sections = rawFileObj.result;

    // filter out only those sections that have the keys we need
    sections = sections.filter((section: any) =>
        Object.keys(keyMap).every((key) => section.hasOwnProperty(key)),
    );

    return sections.map((section: any) => {
        const parsedSection: ISection = {
            dept: "",
            id: "",
            title: "",
            avg: 0,
            instructor: "",
            pass: 0,
            fail: 0,
            audit: 0,
            uuid: "",
            year: 0,
        };
        const keys = Object.keys(keyMap);
        for (const key of keys) {
            const value = section[key];
            const mappedKey = keyMap[key];
            parsedSection[mappedKey] = turnToType(
                value,
                typeof parsedSection[mappedKey],
            );
        }

        if (section.Section === "overall") {
            parsedSection.year = 1900;
        }

        return parsedSection;
    });
}

function turnToType(value: any, type: string): string | number {
    if (type === "string") {
        return String(value);
    } else {
        return Number(value);
    }
}
