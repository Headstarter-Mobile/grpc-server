// utils.js
const grpc = require('@grpc/grpc-js');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');

async function hashPassword(password) {
  try {
    const hash = await argon2.hash(password);
    return hash;
  } catch (err) {
    console.error('Error hashing password:', err);
    throw err;
  }
}

async function verifyPassword(hashedPassword, passwordHashFromClient) {
  try {
    return await argon2.verify(hashedPassword, passwordHashFromClient);
  } catch (err) {
    return false;
  }
}

async function generateToken(userId, permissions) {
  const payload = {
    userId: userId,
    permissions: permissions,
  };
  const secretKey = 'your-secret-key';
  const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
  return token;
}

function validateToken(call, callback, next) {
    const token = call.metadata.get('authorization')[0];
    if (!token) {
      return callback({ code: grpc.status.UNAUTHENTICATED, details: 'Missing token' });
    }
  
    try {
      const decoded = jwt.verify(token, 'your-secret-key');
      call.user = decoded; // Attach user info to call
      next();
    } catch (err) {
      return callback({ code: grpc.status.UNAUTHENTICATED, details: 'Invalid token' });
    }
}
  
function checkPermission(requiredPermission, context) {
    return (call, callback, next) => {
      if (!call.user) {
        return callback({ code: grpc.status.UNAUTHENTICATED, details: 'Missing user context' });
      }
  
      if (call.user.permissions.includes('admin')) {
        return next(); // Admin has all permissions
      }
  
      if (call.user.permissions.includes(requiredPermission)) {
        // Perform contextual checks if needed
        switch (requiredPermission) {
          case 'positions.update.company':
          case 'positions.delete.company':
            if (context && context.companyId === call.user.companyId) {
              return next();
            }
            break;
          case 'applications.read.own':
          case 'applications.create.own':
            if (context && context.userId === call.user.id) {
              return next();
            }
            break;
          case 'companies.update.company':
            if (context && context.companyId === call.user.companyId) {
              return next();
            }
            break;
          case 'offices.create.company':
          case 'offices.update.company':
          case 'offices.delete.company':
            if (context && context.companyId === call.user.companyId) {
              return next();
            }
            break;
          case 'users.delete.own':
          case 'users.update.own':
          case 'auth_tokens.invalidate.own':
            if (context && context.userId === call.user.id) {
              return next();
            }
            break;
          default:
            return next(); // Simple permission check
        }
      }
  
      return callback({ code: grpc.status.PERMISSION_DENIED, details: 'Insufficient permissions' });
    };
}
module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  validateToken,
  checkPermission,
};
