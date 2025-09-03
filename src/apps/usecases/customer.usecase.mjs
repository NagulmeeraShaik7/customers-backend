import Joi from 'joi';
import customerRepository from '../repositories/customer.repository.mjs';
import { escapeLike } from '../../utils/search.utils.mjs';
import { parsePagination } from '../../utils/pagination.utils.mjs';

class CustomerUsecase {
  constructor() {
    this.repo = new customerRepository;
  }

  // Validation schemas
  get createSchema() {
    return Joi.object({
      firstName: Joi.string().trim().required(),
      lastName: Joi.string().trim().required(),
      phone: Joi.string().trim().min(6).required(),
      email: Joi.string().email().optional().allow('', null),
      accountType: Joi.string().valid('standard','premium','enterprise').default('standard'),
      addresses: Joi.array().items(
        Joi.object({
          line1: Joi.string().required(),
          line2: Joi.string().allow('', null),
          city: Joi.string().required(),
          state: Joi.string().required(),
          country: Joi.string().default('India'),
          pincode: Joi.string().required(),
          isPrimary: Joi.boolean().optional(),
          status: Joi.string().valid('active','inactive').default('active'),
        })
      ).optional()
    });
  }

  get updateSchema() {
    return Joi.object({
      firstName: Joi.string().trim().optional(),
      lastName: Joi.string().trim().optional(),
      phone: Joi.string().trim().min(6).optional(),
      email: Joi.string().email().optional(),
      accountType: Joi.string().valid('standard','premium','enterprise').optional()
    }).or('firstName','lastName','phone','email','accountType');
  }

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

  async getCustomerById(id) {
    const c = this.repo.getCustomerById(id);
    if (!c) throw Object.assign(new Error('Customer not found'), { status: 404 });
    return c;
  }

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

  async updateCustomer(id, payload) {
    const { error, value } = this.updateSchema.validate(payload, { abortEarly: false });
    if (error) {
      const e = new Error('Validation failed'); e.status = 400; e.details = error.details.map(d => d.message); throw e;
    }

    if (value.phone) {
      // check unique phone among others
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

  async deleteCustomer(id, options = { allowIfLinked: false }) {
    // placeholder: check linked transactions table if exists
    const ok = this.repo.deleteCustomer(id);
    if (!ok) throw Object.assign(new Error('Customer not found'), { status: 404 });
    return { deletedId: id };
  }

  // Address operations delegation
  async addAddress(customerId, address) { return this.repo.addAddress(Number(customerId), address); }
  async updateAddress(customerId, addressId, patch) { return this.repo.updateAddress(Number(customerId), Number(addressId), patch); }
  async deleteAddress(customerId, addressId) { return this.repo.deleteAddress(Number(customerId), Number(addressId)); }
  async markOnlyOneAddress(customerId, value) { return this.repo.markOnlyOneAddress(Number(customerId), Boolean(value)); }
}

export default new CustomerUsecase();
