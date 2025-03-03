const grpc = require('@grpc/grpc-js');

module.exports = {
  getPosition: (pool) => async (call, callback) => {
    try {
      const { id } = call.request;
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM positions WHERE id = $1', [id]);
      client.release();

      if (result.rows.length > 0) {
        const position = result.rows[0];
        callback(null, { position });
      } else {
        callback({ code: grpc.status.NOT_FOUND, details: 'Position not found' });
      }
    } catch (error) {
      console.error('Error getting position:', error);
      callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
    }
  },
  createPosition: (pool) => async (call, callback) => {
    try {
        const { position } = call.request;
        const client = await pool.connect();
        const result = await client.query('INSERT INTO positions (status, title, description, company_id, office_locations, external_application_link) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [position.status, position.title, position.description, position.company_id, position.office_locations, position.external_application_link]);
        client.release();

        if (result.rows.length > 0) {
            const newPosition = result.rows[0];
            callback(null, { position: newPosition });
        } else {
            callback({code: grpc.status.INTERNAL, details: "could not create position"});
        }

    } catch(error){
        console.error('Error creating position', error);
        callback({code: grpc.status.INTERNAL, details: "Internal server error"});
    }
  },
  getPositionsByCompany: (pool) => async (call, callback) => {
    try {
        const { company_id } = call.request;
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM positions WHERE company_id = $1', [company_id]);
        client.release();
        callback(null, {positions: result.rows});
    } catch(error) {
        console.error('Error getting positions by company', error);
        callback({code: grpc.status.INTERNAL, details: "Internal server error"});
    }
  }
};
