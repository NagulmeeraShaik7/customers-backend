import { Router } from 'express';
import controller from '../controllers/customer.controller.mjs';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management APIs
 */

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [standard, premium, enterprise]
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     line1: { type: string }
 *                     line2: { type: string }
 *                     city: { type: string }
 *                     state: { type: string }
 *                     country: { type: string }
 *                     pincode: { type: string }
 *                     isPrimary: { type: boolean }
 *                     status: { type: string, enum: [active, inactive] }
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate phone/email
 *       500:
 *         description: Internal server error
 */
router.post('/', controller.create);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get list of customers
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by name, phone, email, address
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *       - in: query
 *         name: pincode
 *         schema: { type: string }
 *       - in: query
 *         name: onlyOneAddress
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortDir
 *         schema: { type: string, enum: [ASC, DESC], default: DESC }
 *     responses:
 *       200:
 *         description: Paginated list of customers
 *       500:
 *         description: Internal server error
 */
router.get('/', controller.list);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', controller.getById);

/**
 * @swagger
 * /api/customers/{id}:
 *   patch:
 *     summary: Update customer details
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               accountType: { type: string, enum: [standard, premium, enterprise] }
 *     responses:
 *       200:
 *         description: Updated customer
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', controller.update);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', controller.remove);

/**
 * @swagger
 * /api/customers/{id}/addresses:
 *   post:
 *     summary: Add an address to a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               line1: { type: string }
 *               line2: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               pincode: { type: string }
 *               isPrimary: { type: boolean }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       201:
 *         description: Address added
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/addresses', controller.addAddress);

/**
 * @swagger
 * /api/customers/{id}/addresses/{addressId}:
 *   patch:
 *     summary: Update a customer's address
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               line1: { type: string }
 *               line2: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               country: { type: string }
 *               pincode: { type: string }
 *               isPrimary: { type: boolean }
 *               status: { type: string, enum: [active, inactive] }
 *     responses:
 *       200:
 *         description: Address updated
 *       404:
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/addresses/:addressId', controller.updateAddress);

/**
 * @swagger
 * /api/customers/{id}/addresses/{addressId}:
 *   delete:
 *     summary: Delete a customer's address
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Address deleted
 *       404:
 *         description: Address not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/addresses/:addressId', controller.deleteAddress);

/**
 * @swagger
 * /api/customers/{id}/only-one-address:
 *   post:
 *     summary: Mark customer as having only one address
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated hasOnlyOneAddress flag
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/only-one-address', controller.markOnlyOneAddress);

export default router;
