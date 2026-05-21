exports.sendSuccess = (res, statusCode, message, data = null) => {
    const payload = { success: true, message };

    if (data !== null && data !== undefined) {
        payload.data = data;
    }

    return res.status(statusCode).json(payload);
};

exports.sendError = (res, statusCode, message, extra = {}) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...extra,
    });
};
