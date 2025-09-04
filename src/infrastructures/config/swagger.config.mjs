import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
// Swagger (OpenAPI) configuration for customers-backend (ES6 syntax)
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Customers API',
			version: '1.0.0',
			description: 'API documentation for the Customers backend service\n\n---\n\n### Database Tables\n\n#### customers\n```sql\nCREATE TABLE customers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  firstName TEXT NOT NULL,\n  lastName TEXT NOT NULL,\n  phone TEXT NOT NULL UNIQUE,\n  email TEXT,\n  accountType TEXT DEFAULT \'standard\',\n  hasOnlyOneAddress INTEGER DEFAULT 0,\n  createdAt TEXT DEFAULT (datetime(\'now\')),\n  updatedAt TEXT DEFAULT (datetime(\'now\'))\n);\n```\n\n#### addresses\n```sql\nCREATE TABLE addresses (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  customerId INTEGER NOT NULL,\n  line1 TEXT NOT NULL,\n  line2 TEXT,\n  city TEXT NOT NULL,\n  state TEXT NOT NULL,\n  country TEXT DEFAULT \'India\',\n  pincode TEXT NOT NULL,\n  isPrimary INTEGER DEFAULT 0,\n  status TEXT DEFAULT \'active\',\n  createdAt TEXT DEFAULT (datetime(\'now\')),\n  updatedAt TEXT DEFAULT (datetime(\'now\')),\n  FOREIGN KEY(customerId) REFERENCES customers(id) ON DELETE CASCADE\n);\n```\n\n---\n',
		},
		servers: [
			{
				url: 'http://localhost:3500',
				description: 'Local server',
			},
			{
				url: 'https://customers-backend-yguu.onrender.com',
				description: 'Production server',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
			schemas: {
				Customer: {
					type: 'object',
					properties: {
						id: { type: 'integer', example: 1 },
						firstName: { type: 'string', example: 'John' },
						lastName: { type: 'string', example: 'Doe' },
						phone: { type: 'string', example: '+919876543210' },
						email: { type: 'string', example: 'john.doe@email.com' },
						accountType: { type: 'string', example: 'standard' },
						hasOnlyOneAddress: { type: 'boolean', example: false },
						createdAt: { type: 'string', format: 'date-time', example: '2025-09-03T12:00:00Z' },
						updatedAt: { type: 'string', format: 'date-time', example: '2025-09-03T12:00:00Z' }
					},
				},
				Address: {
					type: 'object',
					properties: {
						id: { type: 'integer', example: 1 },
						customerId: { type: 'integer', example: 1 },
						line1: { type: 'string', example: '123 Main St' },
						line2: { type: 'string', example: 'Apt 4B' },
						city: { type: 'string', example: 'Hyderabad' },
						state: { type: 'string', example: 'Telangana' },
						country: { type: 'string', example: 'India' },
						pincode: { type: 'string', example: '500001' },
						isPrimary: { type: 'boolean', example: true },
						status: { type: 'string', example: 'active' },
						createdAt: { type: 'string', format: 'date-time', example: '2025-09-03T12:00:00Z' },
						updatedAt: { type: 'string', format: 'date-time', example: '2025-09-03T12:00:00Z' }
					},
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
	apis: [
		'./src/apps/controllers/*.mjs',
		'./src/apps/routes/*.mjs',
		// Add more paths if needed
	],
};

export default swaggerOptions;
