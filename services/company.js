const grpc = require('@grpc/grpc-js');

module.exports = {
  getCompany: (pool) => async (call, callback) => {
    try {
      const { id } = call.request;
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM companies WHERE id = $1', [id]);
      client.release();

      if (result.rows.length > 0) {
        const company = result.rows[0];
        callback(null, { company });
      } else {
        callback({ code: grpc.status.NOT_FOUND, details: 'Company not found' });
      }
    } catch (error) {
      console.error('Error getting company:', error);
      callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
    }
  },
  createCompany: (pool) => async (call, callback) => {
    try {
        const { company } = call.request;
        const client = await pool.connect();
        const result = await client.query('INSERT INTO companies (name, description, website, office_locations) VALUES ($1, $2, $3, $4) RETURNING *', [company.name, company.description, company.website, company.office_locations]);
        client.release();

        if (result.rows.length > 0) {
            const newCompany = result.rows[0];
            callback(null, { company: newCompany });
        } else {
            callback({code: grpc.status.INTERNAL, details: "could not create company"});
        }

    } catch(error){
        console.error('Error creating company', error);
        callback({code: grpc.status.INTERNAL, details: "Internal server error"});
    }
  }
};
