const DATASETS = {
    courses: "courses",
    rooms: "rooms",
};

const getKeyType = (key) => {
    const section = {
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
    const room = {
        fullname: "",
        shortname: "",
        number: "",
        name: "",
        address: "",
        lat: 0,
        lon: 0,
        seats: 0,
        type: "",
        furniture: "",
        href: "",
    };
    return section[key] !== undefined ? typeof section[key] : typeof room[key];
};

/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function() {
    const currentDataset = getCurrentDataset();
    const form = getForm(currentDataset);

    const query = {};
    query.WHERE = buildWhere(form, currentDataset);

    query.OPTIONS = {
        COLUMNS: buildColumns(form, currentDataset),
    };

    const order = buildOrder(form, currentDataset);
    if (shouldAppendOrder(order)) {
        query.OPTIONS.ORDER = order;
    }

    const groups = buildGroup(form, currentDataset);
    if (groups.length) {
        query.TRANSFORMATIONS = {
            GROUP: buildGroup(form, currentDataset),
            APPLY: buildApply(form, currentDataset),
        };
    }

    return query;
};

const shouldAppendOrder = (order) => {
    if (typeof order === "string") {
        return true;
    }
    if (Array.isArray(order) && order.length) {
        return true;
    }
    if (typeof order === "object" && order !== null) {
        return Boolean(order.keys.length);
    }
    return false;
};

const buildColumns = (form, dataset) => {
    const container = form.querySelector(".columns");

    const htmlColumns = container.querySelectorAll(".field input");
    const columns = Array.from(htmlColumns)
        .filter((column) => column.checked)
        .map((column) => column.value)
        .map(attachDataset(dataset));

    const htmlTransformationColumns = container.querySelectorAll(
        ".transformation input",
    );
    const transformationColumns = Array.from(htmlTransformationColumns)
        .filter((column) => column.checked)
        .map((column) => column.value);

    return columns.concat(transformationColumns);
};

const buildOrder = (form, dataset) => {
    const select = form.querySelector(".order select");
    const isDescending = form.querySelector(".descending input").checked;

    const transformationOptions = select.querySelectorAll(".transformation");
    const normalOptions = select.querySelectorAll(
        "option:not(.transformation)",
    );

    const selected = Array.from(normalOptions)
        .filter((option) => option.selected)
        .map((option) => option.value);

    const selectedTransformationOptions = Array.from(transformationOptions)
        .filter((option) => option.selected)
        .map((option) => option.value);

    if (!selected.length && !selectedTransformationOptions.length) {
        return [];
    }

    if (selected.length === 1 && !isDescending) {
        return attachDataset(dataset, selected[0]);
    }

    return {
        dir: isDescending ? "DOWN" : "UP",
        keys: selected
            .map(attachDataset(dataset))
            .concat(selectedTransformationOptions),
    };
};

const buildGroup = (form, dataset) => {
    const container = form.querySelector(".groups");

    const groups = container.querySelectorAll(".field input");
    return Array.from(groups)
        .filter((group) => group.checked)
        .map((group) => group.value)
        .map(attachDataset(dataset));
};

const buildApply = (form, dataset) => {
    const container = form.querySelector(".transformations");
    const transformations = container.querySelectorAll(".transformation");
    return Array.from(transformations).map(parseTransformation(dataset));
};

const parseTransformation = (dataset) => (transformation) => {
    const name = transformation.querySelector(".term input").value;
    const operation = transformation.querySelector(".operators select").value;
    const field = transformation.querySelector(".fields select").value;

    return {
        [name]: {
            [operation]: attachDataset(dataset, field),
        },
    };
};

/**
 * Given a form, parses that form and constructs the 'WHERE'
 * block of the query.
 * @param {Element} form
 */
const buildWhere = (form, dataset) => {
    const container = form.querySelector(".conditions");

    const conditionsGroup = container.querySelector(".conditions-container");
    const conditions = getConditions(conditionsGroup, dataset);

    if (!conditions.length) {
        return {};
    }

    const controls = container.querySelector(".condition-type");
    const logicOperator = getLogicOperator(controls);

    return wrapWithOperator(logicOperator, conditions);
};

/**
 * Given a conditions group, parses and returns all of the
 * conditions inside that group.
 * @param {Element} conditionsGroup
 */
const getConditions = (conditionsGroup, dataset) => {
    const htmlConditions = conditionsGroup.querySelectorAll(".condition");
    return Array.from(htmlConditions).map(parseCondition(dataset));
};

/**
 *
 * @param {"courses" | "rooms"} dataset
 * @returns {(condition: Element) => any}
 */
const parseCondition = (dataset) => (condition) => {
    const shouldNegate = condition.querySelector(".not input").checked;

    const field = condition.querySelector(".fields select").value;
    const operator = condition.querySelector(".operators select").value;

    let value = condition.querySelector(".term input").value;
    const type = getKeyType(field);
    if (type === "number") {
        value = parseFloat(value);
    }

    const filter = {
        [operator]: {
            [attachDataset(dataset, field)]: value,
        },
    };

    return shouldNegate ? negate(filter) : filter;
};

const negate = (obj) => ({ NOT: obj });

/**
 * Given a control group, returns the logical operator that
 * corresponds to the options checked in that group.
 * @param {Element} controls
 * @return {"AND" | "OR" | "NOT"}
 */
const getLogicOperator = (controls) => {
    const operationMap = {
        all: "AND",
        any: "OR",
        none: "NOT",
    };

    const inputs = controls.querySelectorAll("input[name=conditionType]");
    const selectedInput = Array.from(inputs).find((input) => input.checked);
    return operationMap[selectedInput.value];
};

/**
 *
 * @param {"AND" | "OR" | "NOT"} operator
 * @param {any[]} conditions
 */
const wrapWithOperator = (operator, conditions) => {
    if (conditions.length === 1 && operator !== "NOT") {
        return conditions[0];
    }

    if (operator === "NOT") {
        if (conditions.length === 1) {
            return {
                NOT: conditions[0],
            };
        }
        return {
            NOT: {
                OR: conditions,
            },
        };
    }
    return { [operator]: conditions };
};

const attachDataset = (dataset, item) => {
    if (item === undefined) {
        return (item) => `${dataset}_${item}`;
    }
    return `${dataset}_${item}`;
};

const getCurrentDataset = () => {
    const activeNavItem = document.querySelector(".nav-item.tab.active");
    return DATASETS[activeNavItem.dataset.type];
};

/**
 * Returns the form of a corresponding dataset.
 * @param {"courses" | "rooms"} dataset
 */
const getForm = (dataset) =>
    document.querySelector(`form[data-type=${dataset}]`);
