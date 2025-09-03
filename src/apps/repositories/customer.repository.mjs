import { getDb } from '../models/customer.model.mjs';

class CustomerRepository {
  // Always fetch the latest db
  get db() {
    return getDb();
  }

  // ---------- Customer CRUD ----------
  createCustomer(data) {
    const stmt = this.db.prepare(`
      INSERT INTO customers (firstName, lastName, phone, email, accountType, hasOnlyOneAddress)
      VALUES (@firstName, @lastName, @phone, @email, @accountType, @hasOnlyOneAddress)
    `);
    const info = stmt.run({
      ...data,
      hasOnlyOneAddress: data.hasOnlyOneAddress ? 1 : 0
    });
    return this.getCustomerById(info.lastInsertRowid);
  }

  getCustomerById(id) {
    const row = this.db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id);
    if (!row) return null;
    row.hasOnlyOneAddress = Boolean(row.hasOnlyOneAddress);
    row.addresses = this.db.prepare(
      `SELECT * FROM addresses WHERE customerId = ? ORDER BY isPrimary DESC, id ASC`
    ).all(id);
    return row;
  }

  updateCustomer(id, patch) {
    const fields = [];
    const params = { id };
    for (const k of ['firstName','lastName','phone','email','accountType']) {
      if (patch[k] !== undefined) {
        fields.push(`${k} = @${k}`);
        params[k] = patch[k];
      }
    }
    if (!fields.length) return this.getCustomerById(id);

    const sql = `UPDATE customers SET ${fields.join(', ')}, updatedAt = datetime('now') WHERE id = @id`;
    this.db.prepare(sql).run(params);
    return this.getCustomerById(id);
  }

  deleteCustomer(id) {
    const info = this.db.prepare(`DELETE FROM customers WHERE id = ?`).run(id);
    return info.changes > 0;
  }

  countCustomers(filterQuery, params) {
    const where = filterQuery ? `WHERE ${filterQuery}` : '';
    const row = this.db.prepare(
      `SELECT COUNT(DISTINCT customers.id) as cnt 
       FROM customers 
       LEFT JOIN addresses ON customers.id = addresses.customerId 
       ${where}`
    ).get(params || {});
    return row ? row.cnt : 0;
  }

  findCustomers({ filterQuery = '', params = {}, sortBy = 'createdAt', sortDir = 'DESC', limit = 10, offset = 0 }) {
    const q = `
      SELECT DISTINCT customers.* FROM customers
      LEFT JOIN addresses ON customers.id = addresses.customerId
      ${filterQuery ? `WHERE ${filterQuery}` : ''}
      ORDER BY customers.${sortBy} ${sortDir}
      LIMIT @limit OFFSET @offset
    `;
    const rows = this.db.prepare(q).all({ ...params, limit, offset });
    return rows.map(r => {
      r.hasOnlyOneAddress = Boolean(r.hasOnlyOneAddress);
      r.addresses = this.db.prepare(
        `SELECT * FROM addresses WHERE customerId = ? ORDER BY isPrimary DESC, id ASC`
      ).all(r.id);
      return r;
    });
  }

  // ---------- Address operations ----------
  addAddress(customerId, address) {
    const tx = this.db.transaction((customerId, address) => {
      if (address.isPrimary) {
        this.db.prepare(`UPDATE addresses SET isPrimary = 0 WHERE customerId = ?`).run(customerId);
      }
      this.db.prepare(`
        INSERT INTO addresses (customerId, line1, line2, city, state, country, pincode, isPrimary, status)
        VALUES (@customerId, @line1, @line2, @city, @state, @country, @pincode, @isPrimary, @status)
      `).run({
        customerId,
        ...address,
        isPrimary: address.isPrimary ? 1 : 0,
        status: address.status || 'active'
      });

      const cnt = this.db.prepare(`SELECT COUNT(*) as c FROM addresses WHERE customerId = ?`).get(customerId).c;
      this.db.prepare(`UPDATE customers SET hasOnlyOneAddress = ?, updatedAt=datetime('now') WHERE id = ?`)
        .run(cnt === 1 ? 1 : 0, customerId);

      return this.getCustomerById(customerId);
    });
    return tx(customerId, address);
  }

  updateAddress(customerId, addressId, patch) {
    const tx = this.db.transaction((customerId, addressId, patch) => {
      if (patch.isPrimary === true) {
        this.db.prepare(`UPDATE addresses SET isPrimary = 0 WHERE customerId = ?`).run(customerId);
      }
      const fields = [];
      const params = { addressId, customerId };
      for (const k of ['line1','line2','city','state','country','pincode','isPrimary','status']) {
        if (patch[k] !== undefined) {
          fields.push(`${k} = @${k}`);
          params[k] = (k === 'isPrimary') ? (patch[k] ? 1 : 0) : patch[k];
        }
      }
      if (fields.length) {
        const sql = `UPDATE addresses SET ${fields.join(', ')}, updatedAt = datetime('now') WHERE id = @addressId AND customerId = @customerId`;
        this.db.prepare(sql).run(params);
      }
      const cnt = this.db.prepare(`SELECT COUNT(*) as c FROM addresses WHERE customerId = ?`).get(customerId).c;
      this.db.prepare(`UPDATE customers SET hasOnlyOneAddress = ?, updatedAt=datetime('now') WHERE id = ?`)
        .run(cnt === 1 ? 1 : 0, customerId);

      return this.getCustomerById(customerId);
    });
    return tx(customerId, addressId, patch);
  }

  deleteAddress(customerId, addressId) {
    const tx = this.db.transaction((customerId, addressId) => {
      this.db.prepare(`DELETE FROM addresses WHERE id = ? AND customerId = ?`).run(addressId, customerId);

      const cnt = this.db.prepare(`SELECT COUNT(*) as c FROM addresses WHERE customerId = ?`).get(customerId).c;
      this.db.prepare(`UPDATE customers SET hasOnlyOneAddress = ?, updatedAt=datetime('now') WHERE id = ?`)
        .run(cnt === 1 ? 1 : 0, customerId);

      return this.getCustomerById(customerId);
    });
    return tx(customerId, addressId);
  }

  markOnlyOneAddress(customerId, value) {
    const cnt = this.db.prepare(`SELECT COUNT(*) as c FROM addresses WHERE customerId = ?`).get(customerId).c;
    if (value === true && cnt !== 1) {
      throw Object.assign(new Error('Cannot mark as Only One Address unless exactly one exists'), { status: 400 });
    }
    if (value === false && cnt <= 1) {
      throw Object.assign(new Error('Cannot unmark when there are not multiple addresses'), { status: 400 });
    }
    this.db.prepare(`UPDATE customers SET hasOnlyOneAddress = ?, updatedAt = datetime('now') WHERE id = ?`)
      .run(value ? 1 : 0, customerId);

    return this.getCustomerById(customerId);
  }

  // ---------- Duplicate checks ----------
  existsByPhone(phone) {
    return !!this.db.prepare(`SELECT 1 FROM customers WHERE phone = ? LIMIT 1`).get(phone);
  }
  existsByEmail(email) {
    if (!email) return false;
    return !!this.db.prepare(`SELECT 1 FROM customers WHERE email = ? LIMIT 1`).get(email);
  }
}

export default CustomerRepository;
