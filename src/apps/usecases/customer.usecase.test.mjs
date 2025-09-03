// customer.usecase.test.mjs
import Joi from 'joi';
import CustomerUsecase from '../usecases/customer.usecase.mjs';
import customerRepository from '../repositories/customer.repository.mjs';

// Mock repository
jest.mock('../repositories/customer.repository.mjs');

describe('CustomerUsecase', () => {
  let usecase;
  let repoMock;

  beforeEach(() => {
    repoMock = {
      existsByPhone: jest.fn(),
      existsByEmail: jest.fn(),
      createCustomer: jest.fn(),
      addAddress: jest.fn(),
      getCustomerById: jest.fn(),
      countCustomers: jest.fn(),
      findCustomers: jest.fn(),
      updateCustomer: jest.fn(),
      deleteCustomer: jest.fn(),
      updateAddress: jest.fn(),
      deleteAddress: jest.fn(),
      markOnlyOneAddress: jest.fn(),
      db: {
        prepare: jest.fn().mockReturnValue({ get: jest.fn() })
      }
    };
    customerRepository.mockImplementation(() => repoMock);
    usecase = new (CustomerUsecase.constructor)(); // force new with mocked repo
    usecase.repo = repoMock;
  });

  // ---------- CREATE ----------
  it('should throw validation error when required fields missing', async () => {
    await expect(usecase.createCustomer({}))
      .rejects.toMatchObject({ status: 400 });
  });

  it('should throw if phone already exists', async () => {
    repoMock.existsByPhone.mockReturnValue(true);
    await expect(
      usecase.createCustomer({ firstName: 'John', lastName: 'Doe', phone: '123456' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('should throw if email already exists', async () => {
    repoMock.existsByPhone.mockReturnValue(false);
    repoMock.existsByEmail.mockReturnValue(true);

    await expect(
      usecase.createCustomer({ firstName: 'John', lastName: 'Doe', phone: '123456', email: 'test@mail.com' })
    ).rejects.toMatchObject({ status: 409 });
  });

  it('should throw if more than one primary address', async () => {
    repoMock.existsByPhone.mockReturnValue(false);
    repoMock.existsByEmail.mockReturnValue(false);

    await expect(
      usecase.createCustomer({
        firstName: 'John',
        lastName: 'Doe',
        phone: '123456',
        addresses: [
          { line1: 'a', city: 'c', state: 's', pincode: 'p', isPrimary: true },
          { line1: 'b', city: 'c', state: 's', pincode: 'p', isPrimary: true }
        ]
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('should create customer successfully', async () => {
  repoMock.existsByPhone.mockReturnValue(false);
  repoMock.existsByEmail.mockReturnValue(false);
  // The usecase returns repoMock.createCustomer result if no addresses, so mock should include addresses: []
  repoMock.createCustomer.mockResolvedValue({ id: 1, firstName: 'John', addresses: [] });
  repoMock.getCustomerById.mockResolvedValue({ id: 1, firstName: 'John', addresses: [] });

  const result = await usecase.createCustomer({ firstName: 'John', lastName: 'Doe', phone: '123456' });
  expect(result).toEqual({ id: 1, firstName: 'John', addresses: [] });
  expect(repoMock.createCustomer).toHaveBeenCalled();
  });

  // ---------- GET ----------
  it('should get customer by id', async () => {
    repoMock.getCustomerById.mockResolvedValue({ id: 1 });
    const result = await usecase.getCustomerById(1);
    expect(result).toEqual({ id: 1 });
  });

  it('should throw if customer not found', async () => {
    repoMock.getCustomerById.mockReturnValue(null);
    await expect(usecase.getCustomerById(1)).rejects.toMatchObject({ status: 404 });
  });

  // ---------- GET LIST ----------
  it('should return paginated customers', async () => {
    repoMock.countCustomers.mockReturnValue(2);
    repoMock.findCustomers.mockReturnValue([{ id: 1 }, { id: 2 }]);

    const result = await usecase.getCustomers({ page: 1, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  // ---------- UPDATE ----------
  it('should throw validation error on update', async () => {
    await expect(usecase.updateCustomer(1, {})).rejects.toMatchObject({ status: 400 });
  });

  it('should throw if phone already used by another customer', async () => {
  repoMock.db.prepare.mockReturnValue({ get: () => ({ id: 2 }) });
  await expect(usecase.updateCustomer(1, { phone: '999999' })).rejects.toMatchObject({ status: 409 });
  });

  it('should update customer successfully', async () => {
    repoMock.db.prepare.mockReturnValue({ get: () => null });
    repoMock.updateCustomer.mockReturnValue({ id: 1, firstName: 'Jane' });

    const result = await usecase.updateCustomer(1, { firstName: 'Jane' });
    expect(result).toEqual({ id: 1, firstName: 'Jane' });
  });

  // ---------- DELETE ----------
  it('should delete customer', async () => {
    repoMock.deleteCustomer.mockReturnValue(true);
    const result = await usecase.deleteCustomer(1);
    expect(result).toEqual({ deletedId: 1 });
  });

  it('should throw if deleting unknown customer', async () => {
    repoMock.deleteCustomer.mockReturnValue(false);
    await expect(usecase.deleteCustomer(1)).rejects.toMatchObject({ status: 404 });
  });

  // ---------- ADDRESS OPS ----------
  it('should add address', async () => {
    repoMock.addAddress.mockResolvedValue({ id: 1, addresses: [{ id: 2 }] });
    const result = await usecase.addAddress(1, { line1: 'addr' });
    expect(result.addresses).toHaveLength(1);
  });

  it('should update address', async () => {
    repoMock.updateAddress.mockResolvedValue({ id: 1, addresses: [{ id: 2, line1: 'x' }] });
    const result = await usecase.updateAddress(1, 2, { line1: 'x' });
    expect(result.addresses[0].line1).toBe('x');
  });

  it('should delete address', async () => {
    repoMock.deleteAddress.mockResolvedValue({ id: 1, addresses: [] });
    const result = await usecase.deleteAddress(1, 2);
    expect(result.addresses).toHaveLength(0);
  });

  it('should mark only one address', async () => {
    repoMock.markOnlyOneAddress.mockResolvedValue({ id: 1, hasOnlyOneAddress: true });
    const result = await usecase.markOnlyOneAddress(1, true);
    expect(result.hasOnlyOneAddress).toBe(true);
  });
});
