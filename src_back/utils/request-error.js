class RequestError extends Error {
    constructor(code, message) {
        super(message);
        this.statusCode = code;
        this.name = 'RequestError';
        Error.captureStackTrace(this, RequestError);
    }
}

module.exports = RequestError;

