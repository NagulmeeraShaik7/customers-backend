import customerUsecase from '../usecases/customer.usecase.mjs';
import pino from 'pino';
const logger = pino();

/**
 * Controller class for managing customer and address-related operations.
 * Uses the customer usecase layer to perform business logic.
 */
class CustomerController {
  /**
   * Create a new customer.
   * @async
   * @param {import('express').Request} req - Express request object containing customer data in the body.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async create(req, res, next) {
    try {
      const created = await customerUsecase.createCustomer(req.body);
      res.status(201).json({ success: true, message: 'Customer created', data: created });
    } catch (err) { logger.error(err); next(err); }
  }

  /**
   * Get a paginated list of customers.
   * @async
   * @param {import('express').Request} req - Express request object containing query params (page, limit, etc.).
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async list(req, res, next) {
    try {
      const result = await customerUsecase.getCustomers(req.query);
      res.json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages
        }
      });
    } catch (err) { logger.error(err); next(err); }
  }

  /**
   * Get a customer by ID.
   * @async
   * @param {import('express').Request} req - Express request object containing customer ID in params.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async getById(req, res, next) {
    try {
      const doc = await customerUsecase.getCustomerById(req.params.id);
      res.json({ success: true, data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  /**
   * Update an existing customer by ID.
   * @async
   * @param {import('express').Request} req - Express request object containing customer ID in params and update data in body.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async update(req, res, next) {
    try {
      const updated = await customerUsecase.updateCustomer(req.params.id, req.body);
      res.json({ success: true, message: 'Customer updated', data: updated });
    } catch (err) { logger.error(err); next(err); }
  }

  /**
   * Delete a customer by ID.
   * @async
   * @param {import('express').Request} req - Express request object containing customer ID in params.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async remove(req, res, next) {
    try {
      const r = await customerUsecase.deleteCustomer(req.params.id);
      res.json({ success: true, message: 'Customer deleted', data: r });
    } catch (err) { logger.error(err); next(err); }
  }

  // ----------------------------
  // Address-related operations
  // ----------------------------

  /**
   * Add a new address for a customer.
   * @async
   * @param {import('express').Request} req - Express request object containing customer ID in params and address data in body.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async addAddress(req, res, next) {
    try {
      const doc = await customerUsecase.addAddress(req.params.id, req.body);
      res.status(201).json({ success: true, message: 'Address added', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  /**
   * Update a customer's address.
   * @async
   * @param {import('express').Request} req - Express request object containing customer ID and addressId in params, update data in body.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async updateAddress(req, res, next) {
    try {
      const doc = await customerUsecase.updateAddress(req.params.id, req.params.addressId, req.body);
      res.json({ success: true, message: 'Address updated', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  /**
   * Delete a customer's address.
   * @async
   * @param {import('express').Request} req - Express request object containing customer ID and addressId in params.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async deleteAddress(req, res, next) {
    try {
      const doc = await customerUsecase.deleteAddress(req.params.id, req.params.addressId);
      res.json({ success: true, message: 'Address deleted', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }

  /**
   * Mark only one address as active/primary for a customer.
   * @async
   * @param {import('express').Request} req - Express request object containing customer ID in params and flag value in body.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} next - Express next middleware function.
   * @returns {Promise<void>}
   */
  async markOnlyOneAddress(req, res, next) {
    try {
      const doc = await customerUsecase.markOnlyOneAddress(req.params.id, req.body.value === true);
      res.json({ success: true, message: 'Flag updated', data: doc });
    } catch (err) { logger.error(err); next(err); }
  }
}

export default new CustomerController();
