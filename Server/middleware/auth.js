const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.vai_tro !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const isStaff = (req, res, next) => {
    if (!['ADMIN', 'NHAN_VIEN'].includes(req.user.vai_tro)) {
        return res.status(403).json({ error: 'Staff access required' });
    }
    next();
};

module.exports = { authMiddleware, isAdmin, isStaff };
