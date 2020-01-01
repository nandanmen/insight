export function getElementByClassName(parent: any, className: string) {
    if (!parent.childNodes) {
        return null;
    }
    return parent.childNodes.find((el: any) => hasClass(el, className));
}

export function hasClass(node: any, className: string) {
    if (node && node.attrs) {
        const classAttr = node.attrs.find((attr: any) => attr.name === "class");
        return classAttr ? classAttr.value === className : false;
    }
    return false;
}

export function textContent(el: any) {
    const text = el.childNodes.find((node: any) => node.nodeName === "#text");
    return text.value.trim();
}

export function getAttribute(attribute: string, el: any) {
    if (!el.attrs) {
        return null;
    }
    const attributeObject = el.attrs.find((attr: any) => attr.name === attribute);
    return attributeObject ? attributeObject.value : null;
}

export function findTable(element: any, rules: Array<(node: any) => boolean>): any {
    if (!element) {
        return null;
    }

    if (!element.childNodes) {
        return null;
    }

    if (isTable(element, rules)) {
        return element;
    }

    for (const node of element.childNodes) {
        const result = findTable(node, rules);
        if (result) {
            return result;
        }
    }
    return null;
}

function isTable(node: any, rules: Array<(node: any) => boolean>) {
    if (!node) {
        return false;
    }
    const rows = node.childNodes;
    return rows ? rows.some((row: any) => hasValidChildren(row, rules)) : false;
}

function hasValidChildren(element: any, rules: Array<(node: any) => boolean>) {
    const nodes: any[] = element.childNodes;
    if (nodes) {
        return rules.every((rule) => nodes.some(rule));
    }
    return false;
}
