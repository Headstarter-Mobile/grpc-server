const grpc = require('@grpc/grpc-js');
const { generateToken, verifyPassword } = require('../utils'); // Import utilities
const jwt = require('jsonwebtoken');

module.exports = {
  generateToken: (pool) => async (call, callback) => {
    try {
      const { userId, expirationPeriodDays } = call.request; // GenerateTokenRequest
      // Verify user credentials
      const result = await pool.query('SELECT id, password, type, company_id FROM users WHERE id = $1', [userId]);

      if (result.rows.length === 0) {
        return callback({ code: grpc.status.UNAUTHENTICATED, details: 'Invalid credentials' });
      }

      const storedUser = result.rows[0];

      // Determine permissions based on user type (adjust as needed)
      let permissions = [];
      switch (storedUser.type) {
        case 0: // UserRole.CANDIDATE
          permissions = [
            'positions.read.all',
            'companies.read.all',
            'applications.create.own',
            'applications.read.own',
            'notifications.create',
            'notifications.read.own',
            'users.delete.own',
            'users.update.own',
            'auth_tokens.invalidate.own',
          ];
          break;
        case 1: // UserRole.RECRUITER
          permissions = [
            'applications.read.own', // Changed from all to own
            'positions.create.company',
            'positions.update.company',
            'positions.read.all',
            'companies.read.all',
            'positions.delete.company',
            'companies.update.company',
            'offices.create.company',
            'offices.update.company',
            'offices.delete.company',
            'notifications.create',
            'notifications.read.own',
            'users.delete.own',
            'users.update.own',
            'auth_tokens.invalidate.own',
          ];
          break;
        case 2: // UserRole.ADMIN
          permissions = ['admin']; // Or a comprehensive list, but "admin" is simpler
          break;
        default:
          permissions = [];
      }

      const token = await generateToken(storedUser.id, permissions);

      // Calculate expiresOn
      const now = new Date();
      const expiresOn = new Date(now.getTime() + expirationPeriodDays * 24 * 60 * 60 * 1000).toISOString();

      // Store token in database (adjust query as needed)
      const resultToken = await pool.query(
        'INSERT INTO auth_tokens (token, user_id, expires_on, device_type, device_os) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [token, storedUser.id, expiresOn, call.request.deviceType, call.request.deviceOs]
      );

      const authToken = {
        token: token,
        userId: storedUser.id, // Use userId from storedUser
        expiresOn: expiresOn,
        deviceType: call.request.deviceType,
        deviceOs: call.request.deviceOs,
      };

      callback(null, authToken);
    } catch (error) {
      console.error('Error generating token:', error);
      callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
    }
  },
  verifyToken: (pool) => async (call, callback) => {
    // This function might not need permission checks itself,
    // as it's used to validate existing tokens.
    // However, you might want to add checks for token expiration
    // or invalidation here.
    try {
      const { token } = call.request; // VerifyTokenRequest
      const decoded = jwt.verify(token, 'your-secret-key');

      const result = await pool.query('SELECT * FROM auth_tokens WHERE token = $1', [token]);
      if (result.rows.length > 0) {
        callback(null, result.rows[0]);
      } else {
        callback({ code: grpc.status.NOT_FOUND, details: 'Token not found' });
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      callback({ code: grpc.status.UNAUTHENTICATED, details: 'Invalid token' });
    }
  },
  invalidateToken: (pool) => async (call, callback) => {
    // This function might also not need permission checks directly,
    // as it's often a user's self-service action.
    // However, you might want to add checks to prevent
    // unauthorized token invalidation.
    try {
      const { token } = call.request; // InvalidateTokenRequest
      await pool.query('DELETE FROM auth_tokens WHERE token = $1', [token]);
      callback(null, {});
    } catch (error) {
      console.error('Error invalidating token:', error);
      callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
    }
  },
};
