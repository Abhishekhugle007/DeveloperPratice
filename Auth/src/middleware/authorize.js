function authorize(...allowedRoles) {
    return (request, response, next) => {
        if (!request.user) {
            return response.status(401).json({ message: "Authentication is required." });
        }

        if (!allowedRoles.includes(request.user.role)) {
            return response.status(403).json({ message: "You are not allowed to access this resource." });
        }

        return next();
    };
}

module.exports = authorize;
