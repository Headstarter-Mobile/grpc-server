const grpc = require('@grpc/grpc-js');
const { validateToken, checkPermission } = require('../utils');

module.exports = {
  getUnseenMessages: (pool) => async (call) => {
    validateToken(call, call.callback, async () => {
      checkPermission('notifications.read.own', { userId: call.user.id })(call, call.callback, async () => {
        try {
          const { id } = call.request; // GetUnseenMessagesRequest (User ID)
          const client = await pool.connect();
          const result = await client.query('SELECT * FROM notifications WHERE user_id = $1 AND read = false', [id]);
          client.release();

          result.rows.forEach((row) => call.write(row));
          call.end();
        } catch (error) {
          console.error('Error getting unseen notifications:', error);
          call.emit('error', { code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },
  markAsRead: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      checkPermission('notifications.update', {})(call, callback, async () => { // Adjust permission string as needed
        try {
          const { id } = call.request; // MarkAsReadRequest (Notification ID)
          const client = await pool.connect();
          await client.query('UPDATE notifications SET read = true WHERE id = $1', [id]);
          client.release();
          callback(null, {});
        } catch (error) {
          console.error('Error marking notification as read:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },
  // Add createNotification function
  createNotification: (pool) => async (call, callback) => {
    validateToken(call, callback, async () => {
      checkPermission('notifications.create', {})(call, callback, async () => { // Adjust permission string as needed
        try {
          const { userId, title, text, type, createdAt, read } = call.request; // call.request is Notification
          const client = await pool.connect();
          const result = await client.query(
            'INSERT INTO notifications (user_id, title, text, type, created_at, read) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [userId, title, text, type, createdAt, read]
          );
          client.release();

          if (result.rows.length > 0) {
            callback(null, result.rows[0]);
          } else {
            callback({ code: grpc.status.INTERNAL, details: 'Could not create notification' });
          }
        } catch (error) {
          console.error('Error creating notification:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal server error' });
        }
      });
    });
  },
  // You might want to add deleteNotification, but consider the permissions
  // carefully. Who is allowed to delete notifications?
};
