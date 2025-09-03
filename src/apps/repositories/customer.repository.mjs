import { getDb } from '../models/customer.model.mjs';

/**
 * Repository class for interacting with the `customers` and `addresses` tables in SQLite.
 * Provides CRUD operations, address management, and duplicate checks.
 */
class CustomerRepository {
  /**
   * Always fetch the latest DB connection.
   * @type {import('better-sqlite3').Database}
   */
  get db() {
    return getDb();
  }

  // ---------- Customer CRUD ----------

  /**
   * Create a new customer.
   * @param {Object} data - Customer data.
   * @param {string} data.firstName - Customer's first name.
   * @param {string} data.lastName - Customer's last name.
   * @param {string} data.phone - Unique phone number.
   * @param {string} [data.email] - Optional email address.
   * @param {string} [data.accountType='standard'] - Account type.
   * @param {boolean} [data.hasOnlyOneAddress=false] - Whether customer has only one address.
   * @returns {Object} The newly created customer with addresses.
   */
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

  /**
   * Get a customer by ID.
   * @param {number} id - Customer ID.
   * @returns {Object|null} Customer object with addresses or `null` if not found.
   */
  getCustomerById(id) {
    const row = this.db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id);
    if (!row) return null;
    row.hasOnlyOneAddress = Boolean(row.hasOnlyOneAddress);
    row.addresses = this.db.prepare(
      `SELECT * FROM addresses WHERE customerId = ? ORDER BY isPrimary DESC, id ASC`
    ).all(id);
    return row;
  }

  /**
   * Update a customer by ID.
   * @param {number} id - Customer ID.
   * @param {Object} patch - Fields to update.
   * @returns {Object|null} Updated customer object or `null` if not found.
   */
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

  /**
   * Delete a customer by ID.
   * @param {number} id - Customer ID.
   * @returns {boolean} True if deleted, false otherwise.
   */
  deleteCustomer(id) {
    const info = this.db.prepare(`DELETE FROM customers WHERE id = ?`).run(id);
    return info.changes > 0;
  }

  /**
   * Count customers with optional filtering.
   * @param {string} [filterQuery] - SQL WHERE conditions (without 'WHERE').
   * @param {Object} [params] - Parameters for the SQL query.
   * @returns {number} Number of matching customers.
   */
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

  /**
   * Find customers with filtering, sorting, and pagination.
   * @param {Object} options - Search options.
   * @param {string} [options.filterQuery] - SQL WHERE conditions.
   * @param {Object} [options.params] - Parameters for filtering.
   * @param {string} [options.sortBy='createdAt'] - Column to sort by.
   * @param {'ASC'|'DESC'} [options.sortDir='DESC'] - Sort direction.
   * @param {number} [options.limit=10] - Max number of results.
   * @param {number} [options.offset=0] - Offset for pagination.
   * @returns {Object[]} Array of customer objects with addresses.
   */
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

  /**
   * Add an address for a customer.
   * If `isPrimary` is true, existing addresses will be unmarked as primary.
   * @param {number} customerId - Customer ID.
   * @param {Object} address - Address data.
   * @param {string} address.line1 - First address line.
   * @param {string} [address.line2] - Second address line.
   * @param {string} address.city - City.
   * @param {string} address.state - State.
   * @param {string} [address.country='India'] - Country.
   * @param {string} address.pincode - Postal code.
   * @param {boolean} [address.isPrimary=false] - Whether this is the primary address.
   * @param {string} [address.status='active'] - Address status.
   * @returns {Object} Updated customer with addresses.
   */
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

  /**
   * Update an existing address.
   * If `isPrimary` is set to true, all other addresses for the customer will be unmarked.
   * @param {number} customerId - Customer ID.
   * @param {number} addressId - Address ID.
   * @param {Object} patch - Fields to update.
   * @returns {Object} Updated customer with addresses.
   */
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

  /**
   * Delete a customer's address.
   * @param {number} customerId - Customer ID.
   * @param {number} addressId - Address ID.
   * @returns {Object} Updated customer with remaining addresses.
   */
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

  /**
   * Mark whether a customer should be flagged as having only one address.
   * Enforces constraints: can only mark true if exactly one exists, and false if multiple exist.
   * @param {number} customerId - Customer ID.
   * @param {boolean} value - Flag value.
   * @throws {Error & {status:number}} If conditions are not met.
   * @returns {Object} Updated customer object.
   */
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

  /**
   * Check if a customer exists by phone number.
   * @param {string} phone - Phone number.
   * @returns {boolean} True if exists, false otherwise.
   */
  existsByPhone(phone) {
    return !!this.db.prepare(`SELECT 1 FROM customers WHERE phone = ? LIMIT 1`).get(phone);
  }

  /**
   * Check if a customer exists by email.
   * @param {string} email - Email address.
   * @returns {boolean} True if exists, false otherwise.
   */
  existsByEmail(email) {
    if (!email) return false;
    return !!this.db.prepare(`SELECT 1 FROM customers WHERE email = ? LIMIT 1`).get(email);
  }
}

export default CustomerRepository;
