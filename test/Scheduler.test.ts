import { expect } from "chai";

import Scheduler, { enrollment, distance } from "../src/scheduler/Scheduler";
import { SchedSection, SchedRoom, Timetable } from "../src/scheduler/IScheduler";

const courseA = {
    courses_dept: "cpsc",
    courses_id: "340",
    courses_uuid: "1319",
    courses_pass: 101,
    courses_fail: 7,
    courses_audit: 2
};

const courseB = {
    courses_dept: "cpsc",
    courses_id: "340",
    courses_uuid: "3397",
    courses_pass: 171,
    courses_fail: 3,
    courses_audit: 1
};

const roomA = {
    rooms_shortname: "BUCH",
    rooms_number: "A101",
    rooms_seats: 275,
    rooms_lat: 49.26826,
    rooms_lon: -123.25468
};

const roomB = {
    rooms_shortname: "ALRD",
    rooms_number: "105",
    rooms_seats: 94,
    rooms_lat: 49.2699,
    rooms_lon: -123.25318
};

describe.only("scheduler", function () {
    const scheduler = new Scheduler();

    it("returns the empty set if no rooms fit", () => {
        const courses = [courseA, courseB];
        const rooms = [roomB];

        const actual = scheduler.schedule(courses, rooms);
        expect(actual).to.have.length(0);
    });

    it("works for small sets", () => {
        const courses = [courseA, courseB];
        const rooms = [roomA, roomB];

        const expected: Timetable = [
            [roomA, courseA, "MWF 0800-0900"],
            [roomA, courseB, "MWF 0900-1000"]
        ];
        const actual = scheduler.schedule(courses, rooms);
        checkTestResult(actual, expected, [courses, rooms]);
    });

    // TODO: Add more tests
});

function checkTestResult(actual: Timetable, expected: Timetable, input: [SchedSection[], SchedRoom[]], delta = 0) {
    const S1 = getScore(actual, input);
    const S2 = getScore(expected, input);
    expect(S1 + delta).to.be.greaterThan(S2);
}

function getScore(timetable: Timetable, input: [SchedSection[], SchedRoom[]]) {
    const MAX_DISTANCE = 1327;
    const totalEnrollment = enrollment(input[0]);

    const rooms = timetable.map((schedule) => schedule[0]);
    const sections = timetable.map((schedule) => schedule[1]);

    const E = enrollment(sections) / totalEnrollment;
    const D = distance(rooms) / MAX_DISTANCE;

    return 0.7 * E + 0.3 * (1 - D);
}
