const grpc = require('@grpc/grpc-js');
const { validateToken, checkPermission } = require('../utils');

module.exports = {
  getPosition: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      checkPermission('positions.read.all', {})(call, callback, async () => { // Adjust permission string as needed
        try {
          const { id } = call.request; // call.request is Position
          const client = await pool.connect();
          const result = await client.query('SELECT * FROM positions WHERE id = $1', [id]);
          client.release();

          if (result.rows.length > 0) {
            callback(null, result.rows[0]);
          } else {
            callback({ code: grpc.status.NOT_FOUND, details: 'Position not found' });
          }
        } catch (error) {
          console.error('Error getting position:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },
  getAllPositions: (pool) => async (call) => {
    validateToken(call, call.callback, async () => {
      checkPermission('positions.read.all', {})(call, callback, async () => { // Adjust permission string as needed
        try {
          const client = await pool.connect();
          const result = await client.query('SELECT * FROM positions');
          client.release();

          result.rows.forEach((row) => call.write(row));
          call.end();
        } catch (error) {
          console.error('Error getting all positions:', error);
          call.emit('error', { code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },
  createPosition: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      checkPermission('positions.create.company', { companyId: call.user.companyId })(call, callback, async () => {
        try {
          const { status, title, description, companyId, externalApplicationLink, createdAt, updatedAt, publishedAt, expiresAt } = call.request; // call.request is Position
          const client = await pool.connect();
          const result = await client.query(
            'INSERT INTO positions (status, title, description, company_id, external_application_link, created_at, updated_at, published_at, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [status, title, description, companyId, externalApplicationLink, createdAt, updatedAt, publishedAt, expiresAt]
          );
          client.release();

          if (result.rows.length > 0) {
            callback(null, result.rows[0]);
          } else {
            callback({ code: grpc.status.INTERNAL, details: 'Could not create position' });
          }
        } catch (error) {
          console.error('Error creating position:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },
  updatePosition: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      try {
        const { oldData, newData } = call.request; // call.request is PositionUpdateRequest
        const { id, status, title, description, companyId, externalApplicationLink, createdAt, updatedAt, publishedAt, expiresAt } = newData;

        const client = await pool.connect();
        const result = await client.query('SELECT company_id FROM positions WHERE id = $1', [id]);
        client.release();

        if (result.rows.length === 0) {
          return callback({ code: grpc.status.NOT_FOUND, details: 'Position not found' });
        }

        const positionCompanyId = result.rows[0].company_id;
        checkPermission('positions.update.company', { companyId: positionCompanyId })(call, callback, async () => {
          const result = await pool.query(
            'UPDATE positions SET status = $2, title = $3, description = $4, company_id = $5, external_application_link = $6, created_at = $7, updated_at = $8, published_at = $9, expires_at = $10 WHERE id = $1 RETURNING *',
            [id, status, title, description, companyId, externalApplicationLink, createdAt, updatedAt, publishedAt, expiresAt]
          );
          callback(null, result.rows[0]);
        });
      } catch (error) {
        console.error('Error updating position:', error);
        callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
      }
    });
  },
  deletePosition: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      try {
        const { id } = call.request; // call.request is Position
        const client = await pool.connect();
        const result = await client.query('SELECT company_id FROM positions WHERE id = $1', [id]);
        client.release();

        if (result.rows.length === 0) {
          return callback({ code: grpc.status.NOT_FOUND, details: 'Position not found' });
        }

        const positionCompanyId = result.rows[0].company_id;
        checkPermission('positions.delete.company', { companyId: positionCompanyId })(call, callback, async () => {
          await client.query('DELETE FROM positions WHERE id = $1', [id]);
          client.release();
          callback(null, {});
        });
      } catch (error) {
        console.error('Error deleting position:', error);
        callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
      }
    });
  },
};
