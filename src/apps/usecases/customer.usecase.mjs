import Joi from 'joi';
import customerRepository from '../repositories/customer.repository.mjs';
import { escapeLike } from '../../utils/search.utils.mjs';
import { parsePagination } from '../../utils/pagination.utils.mjs';

/**
 * Use case class handling customer business logic.
 * Provides validation, uniqueness checks, filtering, and delegates DB operations to the repository.
 */
class CustomerUsecase {
  constructor() {
    /** @type {customerRepository} */
    this.repo = new customerRepository();
  }

  // ---------- Validation Schemas ----------

  /**
   * Joi schema for validating new customer creation payload.
   * @type {Joi.ObjectSchema}
   */
  get createSchema() {
    return Joi.object({
      firstName: Joi.string().trim().required(),
      lastName: Joi.string().trim().required(),
      phone: Joi.string().trim().min(6).required(),
      email: Joi.string().email().optional().allow('', null),
      accountType: Joi.string().valid('standard', 'premium', 'enterprise').default('standard'),
      addresses: Joi.array().items(
        Joi.object({
          line1: Joi.string().required(),
          line2: Joi.string().allow('', null),
          city: Joi.string().required(),
          state: Joi.string().required(),
          country: Joi.string().default('India'),
          pincode: Joi.string().required(),
          isPrimary: Joi.boolean().optional(),
          status: Joi.string().valid('active', 'inactive').default('active'),
        })
      ).optional()
    });
  }

  /**
   * Joi schema for validating customer update payload.
   * Requires at least one updatable field.
   * @type {Joi.ObjectSchema}
   */
  get updateSchema() {
    return Joi.object({
      firstName: Joi.string().trim().optional(),
      lastName: Joi.string().trim().optional(),
      phone: Joi.string().trim().min(6).optional(),
      email: Joi.string().email().optional(),
      accountType: Joi.string().valid('standard', 'premium', 'enterprise').optional()
    }).or('firstName', 'lastName', 'phone', 'email', 'accountType');
  }

  // ---------- Customer CRUD ----------

  /**
   * Create a new customer with optional addresses.
   * Performs validation, duplicate checks, and address primary validation.
   * @param {Object} payload - Customer input.
   * @param {string} payload.firstName - Customer first name.
   * @param {string} payload.lastName - Customer last name.
   * @param {string} payload.phone - Customer phone number (unique).
   * @param {string} [payload.email] - Optional email.
   * @param {string} [payload.accountType] - Account type.
   * @param {Object[]} [payload.addresses] - Optional list of addresses.
   * @returns {Promise<Object>} Created customer with addresses.
   * @throws {Error & {status:number, details?:string[]}} On validation or uniqueness errors.
   */
  async createCustomer(payload) {
    const { error, value } = this.createSchema.validate(payload, { abortEarly: false });
    if (error) {
      const e = new Error('Validation failed');
      e.status = 400;
      e.details = error.details.map(d => d.message);
      throw e;
    }

    if (this.repo.existsByPhone(value.phone)) throw Object.assign(new Error('Phone already exists'), { status: 409 });
    if (value.email && this.repo.existsByEmail(value.email)) throw Object.assign(new Error('Email already exists'), { status: 409 });

    if (value.addresses && value.addresses.filter(a => a.isPrimary).length > 1) {
      throw Object.assign(new Error('Only one address can be primary'), { status: 400 });
    }

    const hasOnlyOneAddress = (value.addresses && value.addresses.length === 1) ? 1 : 0;
    const customer = await this.repo.createCustomer({ ...value, hasOnlyOneAddress });

    if (value.addresses && value.addresses.length) {
      for (const addr of value.addresses) await this.repo.addAddress(customer.id, addr);
      return this.repo.getCustomerById(customer.id);
    }
    return customer;
  }

  /**
   * Get a single customer by ID.
   * @param {number|string} id - Customer ID.
   * @returns {Promise<Object>} Customer object.
   * @throws {Error & {status:number}} If customer is not found.
   */
  async getCustomerById(id) {
    const c = this.repo.getCustomerById(id);
    if (!c) throw Object.assign(new Error('Customer not found'), { status: 404 });
    return c;
  }

  /**
   * Get multiple customers with filtering, searching, sorting, and pagination.
   * @param {Object} query - Query params.
   * @param {string} [query.q] - Search text (matches name, phone, email, address).
   * @param {string} [query.city] - Filter by city.
   * @param {string} [query.state] - Filter by state.
   * @param {string} [query.pincode] - Filter by pincode.
   * @param {'true'|'false'} [query.onlyOneAddress] - Filter by single-address customers.
   * @param {string} [query.sortBy] - Column to sort by.
   * @param {'asc'|'desc'} [query.sortDir] - Sort direction.
   * @param {string|number} [query.page] - Page number.
   * @param {string|number} [query.limit] - Page size.
   * @returns {Promise<{items:Object[], total:number, page:number, limit:number, pages:number}>}
   */
  async getCustomers(query) {
    const { page, limit, offset } = parsePagination(query);
    const sortBy = query.sortBy || 'createdAt';
    const sortDir = (query.sortDir || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const filters = [];
    const params = {};

    if (query.q) {
      filters.push(`(customers.firstName LIKE @q OR customers.lastName LIKE @q OR customers.phone LIKE @q OR customers.email LIKE @q OR addresses.line1 LIKE @q OR addresses.city LIKE @q OR addresses.state LIKE @q OR addresses.pincode LIKE @q)`);
      params.q = `%${escapeLike(query.q)}%`;
    }

    if (query.city) { filters.push('addresses.city = @city'); params.city = query.city; }
    if (query.state) { filters.push('addresses.state = @state'); params.state = query.state; }
    if (query.pincode) { filters.push('addresses.pincode = @pincode'); params.pincode = query.pincode; }

    if (query.onlyOneAddress === 'true') { filters.push('customers.hasOnlyOneAddress = 1'); }
    else if (query.onlyOneAddress === 'false') { filters.push('customers.hasOnlyOneAddress = 0'); }

    const filterQuery = filters.join(' AND ');
    const total = this.repo.countCustomers(filterQuery, params);

    const items = this.repo.findCustomers({
      filterQuery,
      params,
      sortBy,
      sortDir,
      limit,
      offset
    });

    return { items, total, page, limit, pages: Math.ceil(total / limit) || 0 };
  }

  /**
   * Update customer details.
   * Validates payload, checks uniqueness, and updates record.
   * @param {number|string} id - Customer ID.
   * @param {Object} payload - Fields to update.
   * @returns {Promise<Object>} Updated customer object.
   * @throws {Error & {status:number}} On validation, uniqueness, or not found errors.
   */
  async updateCustomer(id, payload) {
    const { error, value } = this.updateSchema.validate(payload, { abortEarly: false });
    if (error) {
      const e = new Error('Validation failed'); e.status = 400; e.details = error.details.map(d => d.message); throw e;
    }

    if (value.phone) {
      const exists = this.repo.db.prepare('SELECT id FROM customers WHERE phone = ?').get(value.phone);
      if (exists && exists.id !== Number(id)) throw Object.assign(new Error('Phone already used'), { status: 409 });
    }
    if (value.email) {
      const exists = this.repo.db.prepare('SELECT id FROM customers WHERE email = ?').get(value.email);
      if (exists && exists.id !== Number(id)) throw Object.assign(new Error('Email already used'), { status: 409 });
    }

    const updated = this.repo.updateCustomer(id, value);
    if (!updated) throw Object.assign(new Error('Customer not found'), { status: 404 });
    return updated;
  }

  /**
   * Delete a customer by ID.
   * @param {number|string} id - Customer ID.
   * @param {{allowIfLinked?:boolean}} [options] - Options (placeholder for foreign key checks).
   * @returns {Promise<{deletedId:number|string}>}
   * @throws {Error & {status:number}} If customer not found.
   */
  async deleteCustomer(id, options = { allowIfLinked: false }) {
    const ok = this.repo.deleteCustomer(id);
    if (!ok) throw Object.assign(new Error('Customer not found'), { status: 404 });
    return { deletedId: id };
  }

  // ---------- Address Delegations ----------

  /**
   * Add an address to a customer.
   * @param {number|string} customerId - Customer ID.
   * @param {Object} address - Address payload.
   * @returns {Promise<Object>} Updated customer with addresses.
   */
  async addAddress(customerId, address) { 
    return this.repo.addAddress(Number(customerId), address); 
  }

  /**
   * Update an existing address.
   * @param {number|string} customerId - Customer ID.
   * @param {number|string} addressId - Address ID.
   * @param {Object} patch - Address fields to update.
   * @returns {Promise<Object>} Updated customer with addresses.
   */
  async updateAddress(customerId, addressId, patch) { 
    return this.repo.updateAddress(Number(customerId), Number(addressId), patch); 
  }

  /**
   * Delete a customer's address.
   * @param {number|string} customerId - Customer ID.
   * @param {number|string} addressId - Address ID.
   * @returns {Promise<Object>} Updated customer with remaining addresses.
   */
  async deleteAddress(customerId, addressId) { 
    return this.repo.deleteAddress(Number(customerId), Number(addressId)); 
  }

  /**
   * Toggle the "only one address" flag for a customer.
   * @param {number|string} customerId - Customer ID.
   * @param {boolean|string} value - Flag value.
   * @returns {Promise<Object>} Updated customer object.
   */
  async markOnlyOneAddress(customerId, value) { 
    return this.repo.markOnlyOneAddress(Number(customerId), Boolean(value)); 
  }
}

export default new CustomerUsecase();
