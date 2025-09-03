// __tests__/customer.controller.test.js
import CustomerController from './customer.controller.mjs';
import customerUsecase from '../usecases/customer.usecase.mjs';

jest.mock('../usecases/customer.usecase.mjs');

describe('CustomerController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  // ------------------
  // Customer tests
  // ------------------

  test('create → should create customer and return 201', async () => {
    const mockCustomer = { id: 1, firstName: 'John' };
    customerUsecase.createCustomer.mockResolvedValue(mockCustomer);

    req.body = { firstName: 'John' };
    await CustomerController.create(req, res, next);

    expect(customerUsecase.createCustomer).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Customer created',
      data: mockCustomer,
    });
  });

  test('list → should return paginated customers', async () => {
    const mockResult = { items: [{ id: 1 }], total: 1, page: 1, limit: 10, pages: 1 };
    customerUsecase.getCustomers.mockResolvedValue(mockResult);

    await CustomerController.list(req, res, next);

    expect(customerUsecase.getCustomers).toHaveBeenCalledWith(req.query);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockResult.items,
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
      },
    });
  });

  test('getById → should return a customer', async () => {
    const mockCustomer = { id: 1, firstName: 'Jane' };
    customerUsecase.getCustomerById.mockResolvedValue(mockCustomer);

    req.params.id = 1;
    await CustomerController.getById(req, res, next);

    expect(customerUsecase.getCustomerById).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCustomer });
  });

  test('update → should update customer', async () => {
    const mockUpdated = { id: 1, firstName: 'Updated' };
    customerUsecase.updateCustomer.mockResolvedValue(mockUpdated);

    req.params.id = 1;
    req.body = { firstName: 'Updated' };
    await CustomerController.update(req, res, next);

    expect(customerUsecase.updateCustomer).toHaveBeenCalledWith(1, req.body);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Customer updated',
      data: mockUpdated,
    });
  });

  test('remove → should delete customer', async () => {
    const mockDeleted = { success: true };
    customerUsecase.deleteCustomer.mockResolvedValue(mockDeleted);

    req.params.id = 1;
    await CustomerController.remove(req, res, next);

    expect(customerUsecase.deleteCustomer).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Customer deleted',
      data: mockDeleted,
    });
  });

  // ------------------
  // Address tests
  // ------------------

  test('addAddress → should add an address', async () => {
    const mockAddress = { id: 100, city: 'NY' };
    customerUsecase.addAddress.mockResolvedValue(mockAddress);

    req.params.id = 1;
    req.body = { city: 'NY' };
    await CustomerController.addAddress(req, res, next);

    expect(customerUsecase.addAddress).toHaveBeenCalledWith(1, req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Address added',
      data: mockAddress,
    });
  });

  test('updateAddress → should update address', async () => {
    const mockUpdated = { id: 100, city: 'LA' };
    customerUsecase.updateAddress.mockResolvedValue(mockUpdated);

    req.params = { id: 1, addressId: 100 };
    req.body = { city: 'LA' };
    await CustomerController.updateAddress(req, res, next);

    expect(customerUsecase.updateAddress).toHaveBeenCalledWith(1, 100, req.body);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Address updated',
      data: mockUpdated,
    });
  });

  test('deleteAddress → should delete address', async () => {
    const mockDeleted = { success: true };
    customerUsecase.deleteAddress.mockResolvedValue(mockDeleted);

    req.params = { id: 1, addressId: 100 };
    await CustomerController.deleteAddress(req, res, next);

    expect(customerUsecase.deleteAddress).toHaveBeenCalledWith(1, 100);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Address deleted',
      data: mockDeleted,
    });
  });

  test('markOnlyOneAddress → should update flag', async () => {
    const mockDoc = { id: 1, hasOnlyOneAddress: true };
    customerUsecase.markOnlyOneAddress.mockResolvedValue(mockDoc);

    req.params.id = 1;
    req.body.value = true;
    await CustomerController.markOnlyOneAddress(req, res, next);

    expect(customerUsecase.markOnlyOneAddress).toHaveBeenCalledWith(1, true);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Flag updated',
      data: mockDoc,
    });
  });

  // ------------------
  // Error handling
  // ------------------

  test('should call next(err) when usecase throws error', async () => {
    const error = new Error('fail');
    customerUsecase.createCustomer.mockRejectedValue(error);

    await CustomerController.create(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
