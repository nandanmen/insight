/**
 * This hooks together all the CampusExplorer methods and binds them to clicks on the submit button in the UI.
 *
 * The sequence is as follows:
 * 1.) Click on submit button in the reference UI
 * 2.) Query object is extracted from UI using global document object (CampusExplorer.buildQuery)
 * 3.) Query object is sent to the POST /query endpoint using global XMLHttpRequest object (CampusExplorer.sendQuery)
 * 4.) Result is rendered in the reference UI by calling CampusExplorer.renderResult with the response from the endpoint as argument
 */

const submitButton = document.getElementById("submit-button");

const testQuery = {
    WHERE: {
        AND: [
            {
                IS: {
                    rooms_furniture: "*Tables*",
                },
            },
            {
                GT: {
                    rooms_seats: 300,
                },
            },
        ],
    },
    OPTIONS: {
        COLUMNS: ["rooms_shortname", "maxSeats"],
        ORDER: {
            dir: "DOWN",
            keys: ["maxSeats"],
        },
    },
    TRANSFORMATIONS: {
        GROUP: ["rooms_shortname"],
        APPLY: [
            {
                maxSeats: {
                    MAX: "rooms_seats",
                },
            },
        ],
    },
};

submitButton.addEventListener("click", () => {
    const query = CampusExplorer.buildQuery();
    CampusExplorer.sendQuery(query).then((res) => {
        CampusExplorer.renderResult(res);
    });
});
