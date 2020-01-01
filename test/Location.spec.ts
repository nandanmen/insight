import { expect } from "chai";
import * as LocationService from "../src/services/LocationService";
import Log from "../src/Util";

describe("LocationService", () => {
    it("Should get location information", () => {
        return LocationService
            .getLocation("6245 Agronomy Road V6T 1Z4")
            .then((res) => {
                expect(res).to.deep.equal({ lat: 49.26125, lon: -123.24807 });
            })
            .catch((err) => {
                Log.error(err);
                expect.fail(err, null, "Should not have rejected");
            });
    });
});
