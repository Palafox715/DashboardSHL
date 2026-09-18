// parser.js

function parseCustomer(text) {

    text = text.trim();

    const match = text.match(/^#(\d+)\s+(.+)$/s);

    if (!match) {
        return null;
    }

    return {
        fileNumber: match[1],
        customerName: match[2].trim()
    };
}


function parsePhone(text) {

    const phoneMatch = text.match(/\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/);

    if (!phoneMatch) {
        return null;
    }

    return {
        phone: phoneMatch[0]
    };
}