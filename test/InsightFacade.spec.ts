import { expect } from "chai";
import * as fs from "fs-extra";
import {
    InsightDatasetKind,
    InsightError,
    NotFoundError,
} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";
import "./Server.spec";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

const KEYS = [
    "Audit",
    "Avg",
    "Fail",
    "Id",
    "Pass",
    "Professor",
    "Subject",
    "Title",
    "Year",
];

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        rooms: "./test/data/rooms.zip",
        notZip: "./test/data/not-zip.txt",
        noCourses: "./test/data/no-courses-folder.zip",
        emptyCourses: "./test/data/empty-courses.zip",
        allInvalidCourses: "./test/data/all-invalid.zip",
        noValidSection: "./test/data/all-valid-empty.zip",
        notJson: "./test/data/not-json.zip",
        noResult: "./test/data/no-results-field.zip",
        someValid: "./test/data/some-valid.zip",
        oneValid: "./test/data/one-valid.zip",
        spaces: "./test/data/spaces.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }

        // load the section tests
        for (const key of KEYS) {
            datasets[`without${key}`] = fs
                .readFileSync(`./test/data/without-${key.toLowerCase()}.zip`)
                .toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    describe("InsightFacade::addDataset", () => {
        it("Should add a valid dataset", function () {
            const id: string = "courses";
            const expected: string[] = [id];
            return insightFacade
                .addDataset(id, datasets[id], InsightDatasetKind.Courses)
                .then((result: string[]) => {
                    expect(result).to.deep.equal(expected);
                })
                .catch((err: any) => {
                    Log.error(err);
                    expect.fail(err, expected, "Should not have rejected");
                });
        });

        it("Should add a rooms dataset", function () {
            return insightFacade
                .addDataset("rooms", datasets.rooms, InsightDatasetKind.Rooms)
                .then((result) => {
                    expect(result).to.deep.equal(["rooms"]);
                })
                .catch((err) => {
                    Log.error(err);
                    expect.fail(err, ["rooms"], "Should not have rejected");
                });
        });

        it("Should add a dataset with at least one valid section", function () {
            const id = "someValid";
            return insightFacade
                .addDataset(id, datasets[id], InsightDatasetKind.Courses)
                .then((result) => {
                    expect(result).to.deep.equal([id]);
                })
                .catch((err) => {
                    Log.info(err);
                    expect.fail(err, [id], "Should not have rejected");
                });
        });

        it("Persists between instances", function () {
            const id = "courses";
            return insightFacade
                .addDataset(id, datasets[id], InsightDatasetKind.Courses)
                .then(() => {
                    return new InsightFacade().addDataset(
                        id,
                        datasets[id],
                        InsightDatasetKind.Courses,
                    );
                })
                .then((result) => {
                    expect.fail(result, null, "Should have rejected");
                })
                .catch((err) => {
                    expect(err).to.be.instanceOf(InsightError);
                });
        });

        describe("Invalid ids", function () {
            const invalidIds = [
                {
                    id: "abcd_",
                    message: "contains an underscore",
                },
                {
                    id: "   ",
                    message: "is only whitespace",
                },
            ];

            for (const { id, message } of invalidIds) {
                it(`Should reject a dataset with an id that ${message}`, function () {
                    return insightFacade
                        .addDataset(id, "", InsightDatasetKind.Courses)
                        .then((result) => {
                            expect.fail(
                                result,
                                new InsightError(),
                                "Should have rejected",
                            );
                        })
                        .catch((err) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
            }

            it("Should reject for a dataset id that was previously added", function () {
                const id = "courses";
                return insightFacade
                    .addDataset(id, datasets[id], InsightDatasetKind.Courses)
                    .then(() => {
                        insightFacade
                            .addDataset(
                                id,
                                datasets[id],
                                InsightDatasetKind.Courses,
                            )
                            .then((result) => {
                                expect.fail(
                                    result,
                                    new InsightError(),
                                    "Should have rejected",
                                );
                            })
                            .catch((err) => {
                                expect(err).to.be.instanceOf(InsightError);
                            });
                    })
                    .catch((err) => {
                        expect.fail(err, null, "Should not have rejected");
                    });
            });
        });

        describe("Invalid zips", function () {
            const tests = [
                {
                    id: "notZip",
                    message: "is not a zip file",
                },
                {
                    id: "noCourses",
                    message: "does not have a courses folder",
                },
                {
                    id: "emptyCourses",
                    message: "has an empty courses folder",
                },
                {
                    id: "allInvalidCourses",
                    message: "has all courses being invalid",
                },
                {
                    id: "noValidSection",
                    message: "has all valid courses but no sections",
                },
                {
                    id: "notJson",
                    message: "contains courses that are not in JSON format",
                },
                {
                    id: "noResult",
                    message:
                        "contains courses that does not have a 'result' field",
                },
            ];

            for (const { id, message } of tests) {
                it(`Should reject for a dataset that ${message}`, function () {
                    return insightFacade
                        .addDataset(
                            id,
                            datasets[id],
                            InsightDatasetKind.Courses,
                        )
                        .then((result) => {
                            expect.fail(
                                result,
                                new InsightError(),
                                "Should have rejected",
                            );
                        })
                        .catch((err) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
            }
        });

        describe("Invalid sections", function () {
            for (const key of KEYS) {
                it(`Only valid course section is missing ${key}`, function () {
                    const id = `without${key}`;
                    return insightFacade
                        .addDataset(
                            id,
                            datasets[id],
                            InsightDatasetKind.Courses,
                        )
                        .then((result) => {
                            expect.fail(
                                result,
                                new InsightError(),
                                "Should have rejected",
                            );
                        })
                        .catch((err) => {
                            expect(err).to.be.instanceOf(InsightError);
                        });
                });
            }
        });
    });

    describe("InsightFacade::removeDataset", function () {
        function addToInsight() {
            return insightFacade
                .addDataset(
                    "courses",
                    datasets.courses,
                    InsightDatasetKind.Courses,
                )
                .catch((err) =>
                    expect.fail(err, null, "Should not have rejected"),
                );
        }

        it("Should remove dataset given valid id and dataset exists", function () {
            const id = "courses";
            const expected = id;
            return addToInsight()
                .then(() => {
                    return insightFacade.removeDataset(id);
                })
                .then((result) => {
                    expect(result).to.deep.equal(expected);
                })
                .catch((err) => {
                    expect.fail(err, expected, "Should not have rejected");
                });
        });

        it("Should reject given an id that contains an underscore", function () {
            const expected = new InsightError();
            return addToInsight()
                .then(() => {
                    return insightFacade.removeDataset("abcd_");
                })
                .then((result) => {
                    expect.fail(result, expected, "Should have rejected");
                })
                .catch((err) => {
                    expect(err).to.be.instanceOf(InsightError);
                });
        });

        it("Should reject given an id that is only whitespace", function () {
            const expected = new InsightError();
            return addToInsight()
                .then(() => {
                    return insightFacade.removeDataset("   ");
                })
                .then((result) => {
                    expect.fail(result, expected, "Should have rejected");
                })
                .catch((err) => {
                    expect(err).to.be.instanceOf(InsightError);
                });
        });

        it("Should reject with a NotFound error if id is valid but does not exist", function () {
            const expected = new NotFoundError();
            return addToInsight()
                .then(() => {
                    return insightFacade.removeDataset("hello");
                })
                .then((result) => {
                    expect.fail(result, expected, "Should have rejected");
                })
                .catch((err) => {
                    expect(err).to.be.instanceOf(NotFoundError);
                });
        });
    });

    describe("InsightFacade ListDatasets", function () {
        it("Should return all added datasets", function () {
            const ids = ["courses", "someValid"];
            const expected = [
                {
                    id: "courses",
                    kind: InsightDatasetKind.Courses,
                    numRows: 64612,
                },
                {
                    id: "rooms",
                    kind: InsightDatasetKind.Rooms,
                    numRows: 364,
                },
            ];

            const promises = expected.map((dataset) =>
                insightFacade.addDataset(
                    dataset.id,
                    datasets[dataset.id],
                    dataset.kind,
                ),
            );

            return Promise.all(promises)
                .then(() => {
                    return insightFacade.listDatasets();
                })
                .then((results) => {
                    expect(results).to.deep.equal(expected);
                })
                .catch((err) => {
                    expect.fail(err, ids, "Should not have rejected");
                });
        });

        it("Should return empty array if there are no datasets", function () {
            return insightFacade
                .listDatasets()
                .then((results) => {
                    expect(results).to.have.lengthOf(0);
                })
                .catch((err) => {
                    expect.fail(err, [], "Should not have rejected");
                });
        });
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", function () {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {
            id: "courses",
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        rooms: {
            id: "rooms",
            path: "./test/data/rooms.zip",
            kind: InsightDatasetKind.Rooms
        }
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(ds.id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade
                        .performQuery(test.query)
                        .then((result) => {
                            TestUtil.checkQueryResult(test, result, done);
                        })
                        .catch((err) => {
                            TestUtil.checkQueryResult(test, err, done);
                        });
                });
            }
        });
    });
});
