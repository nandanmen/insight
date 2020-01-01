import {IScheduler, SchedRoom, SchedSection, TimeSlot, Timetable} from "./IScheduler";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Timetable {
        // TODO Implement this
        return [];
    }
}

export function enrollment(sections: SchedSection[]) {
    return sections.reduce(
        (sum, section) =>
            sum + section.courses_pass + section.courses_fail + section.courses_audit
        , 0);
}

export function distance(rooms: SchedRoom[]) {
    if (!rooms.length) {
        return Infinity;
    }
    return rooms.reduce(
        (maxSoFar, room, index) => {
            let currMax = 0;
            for (let i = index; i < rooms.length; i++) {
                const end = rooms[i];
                const dist = getGreatCircleDistance(room, end);
                currMax = Math.max(currMax, dist);
            }
            return Math.max(maxSoFar, currMax);
        }, 0);
}

function getGreatCircleDistance(start: SchedRoom, end: SchedRoom) {
    const { rooms_lat: lat1, rooms_lon: lon1 } = start;
    const { rooms_lat: lat2, rooms_lon: lon2 } = end;

    const R = 6371e3;
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return d;
}

function toRadians(num: number) {
    return num * Math.PI / 180;
}
