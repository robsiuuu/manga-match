// Middleware to require authentication
export const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    // Verify the authenticated user matches the requested userId
    const requestedUserId = req.params.userId;
    if (requestedUserId && req.user.googleid !== requestedUserId) {
      return res.status(403).json({ 
        success: false,
        message: 'Forbidden: Cannot access other user\'s data' 
      });
    }
    return next();
  }
  
  res.status(401).json({ 
    success: false,
    message: 'Authentication required',
    isAuthenticated: false 
  });
};

// Optional authentication for guest users
export const optionalAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    req.userId = req.user.googleid;
    req.isGuest = false;
  } else {
    req.userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.isGuest = true;
  }
  next();
};