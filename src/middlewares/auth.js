import jwt from 'jsonwebtoken';

export function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'توكن مفقود' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'توكن غير صالح' });
  }
}
