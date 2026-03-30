import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Get user from token
    const user = await User.findById(decoded.userId).select('-password -otp');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token - user not found' 
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

/**
 * Check if user has admin role
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Admin privileges required.' 
  });
};

/**
 * Check if user is authenticated (either admin or the owner)
 */
export const isAuthenticated = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user._id.toString() === req.params.userId)) {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Not authorized.' 
  });
};
