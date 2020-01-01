/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        const request = new XMLHttpRequest();
        request.open("POST", "/query", true);

        request.onload = () => {
            const result = JSON.parse(request.responseText);
            fulfill(result);
        }

        request.onerror = () => {
            const error = JSON.parse(request.responseText);
            reject(error);
        }

        request.setRequestHeader("Content-Type", "application/json");
        request.send(JSON.stringify(query));
    });
};
