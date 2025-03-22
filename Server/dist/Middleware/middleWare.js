export const Middleware = async (req, res, next) => {
    console.log("Middleware");
    next();
};
