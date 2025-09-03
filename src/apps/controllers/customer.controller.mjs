import customerUsecase from '../usecases/customer.usecase.mjs';
import pino from 'pino';
const logger = pino();

class CustomerController {
  async create(req, res, next) {
    try {
      const created = await customerUsecase.createCustomer(req.body);
      res.status(201).json({ success: true, message: 'Customer created', data: created });
    } catch (err) { logger.error(err); next(err); }
  }

  async list(req, res, next) {
    try {
      const result = await customerUsecase.getCustomers(req.query);
      res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, limit: result.limit, pages: result.pages } });
    } catch (err) { logger.error(err); next(err); }
  }

  async getById(req, res, next) {
    try {
      const doc = await customerUsecase.getCustomerById(req.params.id);
      res.json({ success: true, data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  async update(req, res, next) {
    try {
      const updated = await customerUsecase.updateCustomer(req.params.id, req.body);
      res.json({ success: true, message: 'Customer updated', data: updated });
    } catch (err) { logger.error(err); next(err); }
  }

  async remove(req, res, next) {
    try {
      const r = await customerUsecase.deleteCustomer(req.params.id);
      res.json({ success: true, message: 'Customer deleted', data: r });
    } catch (err) { logger.error(err); next(err); }
  }

  // Addresses
  async addAddress(req, res, next) {
    try {
      const doc = await customerUsecase.addAddress(req.params.id, req.body);
      res.status(201).json({ success: true, message: 'Address added', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  async updateAddress(req, res, next) {
    try {
      const doc = await customerUsecase.updateAddress(req.params.id, req.params.addressId, req.body);
      res.json({ success: true, message: 'Address updated', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  async deleteAddress(req, res, next) {
    try {
      const doc = await customerUsecase.deleteAddress(req.params.id, req.params.addressId);
      res.json({ success: true, message: 'Address deleted', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  async markOnlyOneAddress(req, res, next) {
    try {
      const doc = await customerUsecase.markOnlyOneAddress(req.params.id, req.body.value === true);
      res.json({ success: true, message: 'Flag updated', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }
}

export default new CustomerController();
