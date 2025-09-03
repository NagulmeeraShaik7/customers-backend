import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
// Swagger (OpenAPI) configuration for customers-backend (ES6 syntax)
const swaggerOptions = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Customers API',
			version: '1.0.0',
			description: 'API documentation for the Customers backend service',
		},
		servers: [
			{
				url: 'http://localhost:3500',
				description: 'Local server',
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
