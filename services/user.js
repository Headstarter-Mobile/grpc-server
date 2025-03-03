const grpc = require('@grpc/grpc-js');

module.exports = {
  getUser: (pool) => async (call, callback) => {
    try {
      const { id } = call.request;
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      client.release();

      if (result.rows.length > 0) {
        const user = result.rows[0];
        callback(null, { user });
      } else {
        callback({ code: grpc.status.NOT_FOUND, details: 'User not found' });
      }
    } catch (error) {
      console.error('Error getting user:', error);
      callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
    }
  },
  createUser: (pool) => async (call, callback) => {
    try {
        const { user } = call.request;
        const client = await pool.connect();
        const result = await client.query('INSERT INTO users (name, email, password, type) VALUES ($1, $2, $3, $4) RETURNING *', [user.name, user.email, user.password, user.type]);
        client.release();

        if (result.rows.length > 0) {
            const newUser = result.rows[0];
            callback(null, { user: newUser });
        } else {
            callback({code: grpc.status.INTERNAL, details: "could not create user"});
        }

    } catch(error){
        console.error('Error creating user', error);
        callback({code: grpc.status.INTERNAL, details: "Internal server error"});
    }
  }
};
