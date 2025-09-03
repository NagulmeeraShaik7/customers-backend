import { Router } from 'express';
import controller from '../controllers/customer.controller.mjs';

const router = Router();

router.post('/', controller.create);
router.get('/', controller.list); // supports ?q=&city=&state=&pincode=&onlyOneAddress=&page=&limit=&sortBy=&sortDir=
router.get('/:id', controller.getById);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

// Addresses
router.post('/:id/addresses', controller.addAddress);
router.patch('/:id/addresses/:addressId', controller.updateAddress);
router.delete('/:id/addresses/:addressId', controller.deleteAddress);
router.post('/:id/only-one-address', controller.markOnlyOneAddress);

export default router;
