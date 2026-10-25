// Runs once, automatically, the first time the MongoDB container starts with an
// EMPTY mongodb_data volume (mounted into /docker-entrypoint-initdb.d).
// It prepares the collection and the unique email index used by the API.
const database = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'employee_db');

if (!database.getCollectionNames().includes('employees')) {
  database.createCollection('employees');
}
database.employees.createIndex({ email: 1 }, { unique: true });
database.employees.createIndex({ department: 1 });

print('Employee database initialised.');
