import { getDatabase } from 'firebase/database';
import app, { isFirebaseAvailable } from './firebase';

let database = null;

if (isFirebaseAvailable() && app) {
  try {
    database = getDatabase(app);
    console.log('Realtime Database initialized');
  } catch (error) {
    console.error('Realtime Database initialization error:', error);
  }
}

export { database };
export default database;
