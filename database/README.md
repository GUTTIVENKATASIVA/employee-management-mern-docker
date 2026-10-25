# Database folder

| File | Purpose |
| --- | --- |
| `sample-employees.json` | 15 sample employees. The backend inserts them on first start when `SEED_ON_START=true` and the collection is empty. |
| `init-mongo.js` | Mounted into `/docker-entrypoint-initdb.d/`. Runs once on a brand-new volume and creates the `employees` collection and indexes. |

Data lives in the Docker named volume `mongodb_data`, not in this folder.
