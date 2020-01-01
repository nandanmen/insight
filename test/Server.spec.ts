import Server from "../src/rest/Server";
import * as fs from "fs-extra";

import chai = require("chai");
import chaiHttp = require("chai-http");

import { expect } from "chai";
import { InsightDatasetKind } from "../src/controller/IInsightFacade";
import Log from "../src/Util";

const BASE_API_URL = `http://localhost:4321`;

describe("Facade D3", function () {
    let server: Server = null;
    const cacheDir = __dirname + "/../data";

    chai.use(chaiHttp);

    before(function () {
        server = new Server(4321);
        return server.start().catch((err) => {
            expect.fail("", "", `Failed to start server: ${err}`);
        });
    });

    after(function () {
        return server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
        } catch (err) {
            Log.error(err);
        }
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    const addDataset = (
        id: string,
        kind: InsightDatasetKind,
        content: any,
    ) => {
        return chai
            .request(BASE_API_URL)
            .put(`/dataset/${id}/${kind}`)
            .send(content)
            .set("Content-Type", "application/x-zip-compressed");
    };

    const removeDataset = (id: string) => {
        return chai
            .request(BASE_API_URL)
            .del(`/dataset/${id}`);
    };

    const performQuery = <T extends {}>(queryBody: T) => {
        return chai
            .request(BASE_API_URL)
            .post("/query")
            .send(queryBody);
    };

    const listDatasets = () => {
        return chai
            .request(BASE_API_URL)
            .get("/datasets");
    };

    const courses = fs
        .readFileSync("./test/data/courses.zip");
    const rooms = fs.readFileSync("./test/data/rooms.zip");
    const invalid = fs
        .readFileSync("./test/data/all-invalid.zip");

    const datasets: { [key: string]: any } = {
        courses,
        rooms,
        invalid
    };

    describe("PUT requests", () => {
        it("Adds a courses dataset", () => {
            return addDataset("courses", InsightDatasetKind.Courses, courses)
                .then((res) => {
                    const { result } = res.body;
                    expect(res.status).to.be.equal(200);
                    expect(result).to.include("courses");
                })
                .catch((err) => {
                    expect.fail("", "", `Should not have failed: ${err}`);
                });
        });

        it("Adds a rooms dataset", () => {
            return addDataset("rooms", InsightDatasetKind.Rooms, rooms)
                .then((res) => {
                    const { result } = res.body;
                    expect(res.status).to.be.equal(200);
                    expect(result).to.include("rooms");
                })
                .catch((err) => {
                    expect.fail("", "", `Should not have failed: ${err}`);
                });
        });

        it("Rejects if addDataset rejects", () => {
            return addDataset("invalid", InsightDatasetKind.Courses, invalid)
                .then((res) => {
                    expect.fail("", "", `Should not have fulfilled: ${res}`);
                })
                .catch((res) => {
                    const { error } = res.response.body;
                    expect(res.status).to.be.equal(400);
                    expect(typeof error).to.be.equal("string");
                });
        });
    });

    describe("DELETE requests", () => {
        it("Removes a dataset", () => {
            return addDataset("courses", InsightDatasetKind.Courses, courses)
                .then(() => removeDataset("courses"))
                .then((res) => {
                    const { result } = res.body;
                    expect(res.status).to.be.equal(200);
                    expect(result).to.be.equal("courses");
                })
                .catch((err) => {
                    expect.fail("", "", `Should not have failed: ${err}`);
                });
        });

        it("Returns 400 if InsightError", () => {
            return removeDataset("hello_")
                .then((res) => {
                    expect.fail("", "", `Should not have fulfilled: ${res}`);
                })
                .catch((res) => {
                    const { error } = res.response.body;
                    expect(res.status).to.be.equal(400);
                    expect(typeof error).to.be.equal("string");
                });
        });

        it("Returns 404 if NotFound", () => {
            return removeDataset("courses")
                .then((res) => {
                    expect.fail("", "", `Should not have fulfilled: ${res}`);
                })
                .catch((res) => {
                    const { error } = res.response.body;
                    expect(res.status).to.be.equal(404);
                    expect(typeof error).to.be.equal("string");
                });
        });
    });

    const query = {
        WHERE: {
            AND: [
                {
                    IS: {
                        rooms_furniture: "*Tables*"
                    }
                },
                {
                    GT: {
                        rooms_seats: 300
                    }
                }
            ]
        },
        OPTIONS: {
            COLUMNS: [
                "rooms_shortname",
                "maxSeats"
            ],
            ORDER: {
                dir: "DOWN",
                keys: [
                    "maxSeats"
                ]
            }
        },
        TRANSFORMATIONS: {
            GROUP: [
                "rooms_shortname"
            ],
            APPLY: [
                {
                    maxSeats: {
                        MAX: "rooms_seats"
                    }
                }
            ]
        }
    };

    const results = [
        {
            rooms_shortname: "OSBO",
            maxSeats: 442
        },
        {
            rooms_shortname: "HEBB",
            maxSeats: 375
        },
        {
            rooms_shortname: "LSC",
            maxSeats: 350
        }
    ];

    describe("POST query", () => {
        it("Performs a query", () => {
            return addDataset("rooms", InsightDatasetKind.Rooms, rooms)
                .then(() => performQuery(query))
                .then((res) => {
                    const { result } = res.body;
                    expect(res.status).to.be.equal(200);
                    expect(result).to.deep.equal(results);
                })
                .catch((err) => {
                    expect.fail("", "", `Should not have failed: ${err}`);
                });
        });

        it("Rejects with 400 for invalid queries", () => {
            return performQuery({})
                .then((res) => {
                    expect.fail("", "", `Should not have fulfilled: ${res}`);
                })
                .catch((res) => {
                    const { error } = res.response.body;
                    expect(res.status).to.be.equal(400);
                    expect(typeof error).to.be.equal("string");
                });
        });
    });

    describe("GET datasets", () => {
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

        const setup = () => {
            const promises = expected.map(({ id, kind }) => {
                return addDataset(id, kind, datasets[id]);
            });
            return Promise.all(promises);
        };

        it("Gets list of datasets", () => {
            return setup()
                .then(() => listDatasets())
                .then((res) => {
                    const { result } = res.body;
                    expect(res.status).to.be.equal(200);
                    expect(result).to.deep.equal(expected);
                })
                .catch((err) => {
                    expect.fail("", "", `Should not have failed: ${err}`);
                });
        });
    });
});
