import { randomBytes } from 'node:crypto';
import { duplicateEmailError } from '../../src/errors.js';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const newId = () => randomBytes(12).toString('hex');

/** In-memory stand-in for the MongoDB repository, used only by the tests. */
export function createMemoryRepository(initial = []) {
  let items = initial.map((e) => ({ id: newId(), ...e }));

  const emailTaken = (email, exceptId) =>
    items.some((e) => e.email === email && e.id !== exceptId);

  return {
    isValidId: (id) => OBJECT_ID_RE.test(String(id)),

    async list({ search, department, status } = {}) {
      const term = (search || '').toLowerCase();
      return items
        .filter((e) => !department || e.department === department)
        .filter((e) => !status || e.status === status)
        .filter(
          (e) =>
            !term ||
            [e.name, e.email, e.position].some((v) => v.toLowerCase().includes(term))
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((e) => ({ ...e }));
    },

    async get(id) {
      const found = items.find((e) => e.id === id);
      return found ? { ...found } : null;
    },

    async create(data) {
      if (emailTaken(data.email)) throw duplicateEmailError();
      const created = { id: newId(), ...data };
      items.push(created);
      return { ...created };
    },

    async update(id, data) {
      const index = items.findIndex((e) => e.id === id);
      if (index === -1) return null;
      if (emailTaken(data.email, id)) throw duplicateEmailError();
      items[index] = { id, ...data };
      return { ...items[index] };
    },

    async remove(id) {
      const index = items.findIndex((e) => e.id === id);
      if (index === -1) return null;
      const [removed] = items.splice(index, 1);
      return removed;
    },

    async count() {
      return items.length;
    },

    async insertMany(list) {
      list.forEach((e) => items.push({ id: newId(), ...e }));
      return list.length;
    },

    async deleteAll() {
      items = [];
    }
  };
}
