export const user = async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json({ data: { user } });
    }
    catch (error) {
    }
};
