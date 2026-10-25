import Employee from '../models/Employee.js';
import { duplicateEmailError } from '../errors.js';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Convert a lean Mongo document into the public API shape. */
function serialize(doc) {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

function translateError(err) {
  if (err && err.code === 11000) return duplicateEmailError();
  return err;
}

export function createMongoRepository() {
  return {
    isValidId: (id) => OBJECT_ID_RE.test(String(id)),

    async list({ search, department, status } = {}) {
      const query = {};
      if (department) query.department = department;
      if (status) query.status = status;
      if (search) {
        const rx = new RegExp(escapeRegex(search), 'i');
        query.$or = [{ name: rx }, { email: rx }, { position: rx }];
      }
      const docs = await Employee.find(query).sort({ name: 1 }).lean();
      return docs.map(serialize);
    },

    async get(id) {
      return serialize(await Employee.findById(id).lean());
    },

    async create(data) {
      try {
        const doc = await Employee.create(data);
        return serialize(doc.toObject());
      } catch (err) {
        throw translateError(err);
      }
    },

    async update(id, data) {
      try {
        const doc = await Employee.findByIdAndUpdate(id, data, {
          new: true,
          runValidators: true
        }).lean();
        return serialize(doc);
      } catch (err) {
        throw translateError(err);
      }
    },

    async remove(id) {
      return serialize(await Employee.findByIdAndDelete(id).lean());
    },

    async count() {
      return Employee.countDocuments();
    },

    async insertMany(items) {
      const docs = await Employee.insertMany(items);
      return docs.length;
    },

    async deleteAll() {
      await Employee.deleteMany({});
    }
  };
}
