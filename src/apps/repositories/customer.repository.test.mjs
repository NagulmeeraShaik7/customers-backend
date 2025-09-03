import CustomerRepository from './customer.repository.mjs';
import { getDb, initDb } from '../models/customer.model.mjs';

// Helper to reset DB for each test (assuming getDb returns a new DB or can be reset)
function resetDb() {
	const db = getDb();
	db.exec(`
		DELETE FROM addresses;
		DELETE FROM customers;
		DELETE FROM sqlite_sequence WHERE name IN ('customers', 'addresses');
	`);
}

describe('CustomerRepository', () => {
	let repo;
	beforeAll(() => {
		initDb();
	});
	beforeEach(() => {
		resetDb();
		repo = new CustomerRepository();
	});

	describe('Customer CRUD', () => {
		it('should create and fetch a customer', () => {
			const data = { firstName: 'John', lastName: 'Doe', phone: '1234567890', email: 'john@example.com', accountType: 'standard', hasOnlyOneAddress: false };
			const customer = repo.createCustomer(data);
			expect(customer).toMatchObject({ firstName: 'John', lastName: 'Doe', phone: '1234567890', email: 'john@example.com', hasOnlyOneAddress: false });
			expect(customer.id).toBeDefined();
		});

		it('should get customer by id', () => {
			const c = repo.createCustomer({ firstName: 'A', lastName: 'B', phone: '111', email: 'a@b.com', accountType: 'standard', hasOnlyOneAddress: false });
			const fetched = repo.getCustomerById(c.id);
			expect(fetched).toBeTruthy();
			expect(fetched.id).toBe(c.id);
		});

		it('should update a customer', () => {
			const c = repo.createCustomer({ firstName: 'A', lastName: 'B', phone: '222', email: 'a@b.com', accountType: 'standard', hasOnlyOneAddress: false });
			const updated = repo.updateCustomer(c.id, { firstName: 'Z', accountType: 'premium' });
			expect(updated.firstName).toBe('Z');
			expect(updated.accountType).toBe('premium');
		});

		it('should delete a customer', () => {
			const c = repo.createCustomer({ firstName: 'A', lastName: 'B', phone: '333', email: 'a@b.com', accountType: 'standard', hasOnlyOneAddress: false });
			const deleted = repo.deleteCustomer(c.id);
			expect(deleted).toBe(true);
			expect(repo.getCustomerById(c.id)).toBeNull();
		});
	});

	describe('Customer search and count', () => {
		beforeEach(() => {
			repo.createCustomer({ firstName: 'A', lastName: 'B', phone: '444', email: 'a@b.com', accountType: 'standard', hasOnlyOneAddress: false });
			repo.createCustomer({ firstName: 'C', lastName: 'D', phone: '555', email: 'c@d.com', accountType: 'standard', hasOnlyOneAddress: false });
		});
		it('should count customers', () => {
			expect(repo.countCustomers()).toBe(2);
		});
		it('should filter and paginate customers', () => {
			const found = repo.findCustomers({ filterQuery: 'firstName = @fn', params: { fn: 'A' }, limit: 1 });
			expect(found.length).toBe(1);
			expect(found[0].firstName).toBe('A');
		});
	});

	describe('Address operations', () => {
		let customer;
		beforeEach(() => {
			customer = repo.createCustomer({ firstName: 'E', lastName: 'F', phone: '666', email: 'e@f.com', accountType: 'standard', hasOnlyOneAddress: false });
		});
		it('should add an address', () => {
			const updated = repo.addAddress(customer.id, { line1: '123 St', line2: '', city: 'X', state: 'Y', country: 'India', pincode: '12345', isPrimary: true });
			expect(updated.addresses.length).toBe(1);
			expect(updated.addresses[0].isPrimary).toBe(1);
		});
		it('should update an address', () => {
			let updated = repo.addAddress(customer.id, { line1: '123 St', line2: '', city: 'X', state: 'Y', country: 'India', pincode: '12345', isPrimary: true });
			const addrId = updated.addresses[0].id;
			updated = repo.updateAddress(customer.id, addrId, { city: 'Z', isPrimary: true });
			expect(updated.addresses[0].city).toBe('Z');
			expect(updated.addresses[0].isPrimary).toBe(1);
		});
		it('should delete an address', () => {
			let updated = repo.addAddress(customer.id, { line1: '123 St', line2: '', city: 'X', state: 'Y', country: 'India', pincode: '12345', isPrimary: true });
			const addrId = updated.addresses[0].id;
			updated = repo.deleteAddress(customer.id, addrId);
			expect(updated.addresses.length).toBe(0);
		});
		it('should mark only one address', () => {
			repo.addAddress(customer.id, { line1: 'A', line2: '', city: 'C', state: 'S', country: 'India', pincode: '1', isPrimary: true });
			const marked = repo.markOnlyOneAddress(customer.id, true);
			expect(marked.hasOnlyOneAddress).toBe(true);
			repo.addAddress(customer.id, { line1: 'B', line2: '', city: 'C', state: 'S', country: 'India', pincode: '2', isPrimary: false });
			expect(() => repo.markOnlyOneAddress(customer.id, true)).toThrow();
			const unmarked = repo.markOnlyOneAddress(customer.id, false);
			expect(unmarked.hasOnlyOneAddress).toBe(false);
		});
	});

	describe('Duplicate checks', () => {
		beforeEach(() => {
			repo.createCustomer({ firstName: 'G', lastName: 'H', phone: '777', email: 'g@h.com', accountType: 'standard', hasOnlyOneAddress: false });
		});
		it('should check existsByPhone', () => {
			expect(repo.existsByPhone('777')).toBe(true);
			expect(repo.existsByPhone('notfound')).toBe(false);
		});
		it('should check existsByEmail', () => {
			expect(repo.existsByEmail('g@h.com')).toBe(true);
			expect(repo.existsByEmail('not@found.com')).toBe(false);
			expect(repo.existsByEmail(undefined)).toBe(false);
		});
	});
});
