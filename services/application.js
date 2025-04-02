const grpc = require('@grpc/grpc-js');
const { validateToken, checkPermission } = require('../utils');

module.exports = {
  getApplication: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      checkPermission('applications.read.all')(call, callback, async () => {
        try {
          const { id } = call.request; // Now call.request is an Application message
          const client = await pool.connect();
          const result = await client.query('SELECT * FROM applications WHERE id = $1', [id]);
          client.release();

          if (result.rows.length > 0) {
            callback(null, result.rows[0]);
          } else {
            callback({ code: grpc.status.NOT_FOUND, details: 'Application not found' });
          }
        } catch (error) {
          console.error('Error getting application:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },

  getAllApplications: (pool) => async (call) => {
    validateToken(call, call.callback, async () => {
      // Permission check based on user role.
      if (call.user.permissions.includes('applications.read.all')) {
        checkPermission('applications.read.all')(call, call.callback, async () => {
          try {
            let query = 'SELECT * FROM applications WHERE 1=1';
            const values = [];

            if (call.request.userId) { // call.request is GetAllApplicationsRequest
              query += ' AND user_id = $' + (values.length + 1);
              values.push(call.request.userId);
            }
            // ... (other filters) ...

            const client = await pool.connect();
            const result = await client.query(query, values);
            client.release();

            result.rows.forEach((row) => call.write(row));
            call.end();
          } catch (error) {
            console.error('Error getting all applications:', error);
            call.emit('error', { code: grpc.status.INTERNAL, details: 'Internal server error' });
          }
        });
      } else {
        checkPermission('applications.read.own', { userId: call.user.id })(call, call.callback, async () => {
          try {
            let query = 'SELECT * FROM applications WHERE user_id = $1';
            const values = [call.user.id];

            // ... (other filters) ...

            const client = await pool.connect();
            const result = await client.query(query, values);
            client.release();

            result.rows.forEach((row) => call.write(row));
            call.end();
          } catch (error) {
            console.error('Error getting all applications:', error);
            call.emit('error', { code: grpc.status.INTERNAL, details: 'Internal server error' });
          }
        });
      }
    });
  },

  createApplication: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      checkPermission('applications.create.own', { userId: call.user.id })(call, callback, async () => {
        try {
          const { userId, positionId, status, createdAt, updatedAt } = call.request; // call.request is Application
          const client = await pool.connect();
          const result = await client.query(
            'INSERT INTO applications (user_id, position_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, positionId, status, createdAt, updatedAt]
          );
          client.release();

          if (result.rows.length > 0) {
            callback(null, result.rows[0]);
          } else {
            callback({ code: grpc.status.INTERNAL, details: 'Could not create application' });
          }
        } catch (error) {
          console.error('Error creating application:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },

  updateApplication: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      // Assuming only admins can update applications
      checkPermission('applications.update', {})(call, callback, async () => { // Adjust permission string as needed
        try {
          const { oldData, newData } = call.request; // call.request is UpdateApplicationRequest
          const { id, userId, positionId, status, createdAt, updatedAt } = newData;

          // You might want to use oldData for optimistic concurrency control or auditing
          const client = await pool.connect();
          const result = await client.query(
            'UPDATE applications SET user_id = $2, position_id = $3, status = $4, created_at = $5, updated_at = $6 WHERE id = $1 RETURNING *',
            [id, userId, positionId, status, createdAt, updatedAt]
          );
          client.release();

          if (result.rows.length > 0) {
            callback(null, result.rows[0]);
          } else {
            callback({ code: grpc.status.NOT_FOUND, details: 'Application not found' });
          }
        } catch (error) {
          console.error('Error updating application:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },

  deleteApplication: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      // Assuming only admins can delete applications
      checkPermission('applications.delete', {})(call, callback, async () => { // Adjust permission string as needed
        try {
          const { id } = call.request; // call.request is Application
          const client = await pool.connect();
          await client.query('DELETE FROM applications WHERE id = $1', [id]);
          client.release();
          callback(null, {});
        } catch (error) {
          console.error('Error deleting application:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },
};
