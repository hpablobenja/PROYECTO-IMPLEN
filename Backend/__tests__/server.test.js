// Backend/__tests__/server.test.js
const request = require('supertest');
const { mock } = require('jest-mock-extended');

// Importa tu aplicación (server.js)
const app = require('../server');

// Mockear los modelos de Mongoose (User y Product)
// Esto es CRUCIAL para que los tests no intenten conectar a la BD
jest.mock('../models/users', () => {
    const mockUser = mock();
    mockUser.findOne = jest.fn();
    mockUser.save = jest.fn();
    return mockUser;
});

jest.mock('../models/Product', () => {
    const mockProduct = mock();
    mockProduct.findOne = jest.fn();
    return mockProduct;
});

// Mockear la conexión a la base de datos (main) si causa problemas sin DB
jest.mock('../models/index', () => ({
    main: jest.fn(), // Mockea la función main para que no intente conectar a DB
}));

// Obtener las referencias a los mocks
const MockUser = require('../models/users');
const MockProduct = require('../models/Product');


// Limpiar los mocks antes de cada test para aislar las pruebas
beforeEach(() => {
    jest.clearAllMocks(); // Esto limpia todas las llamadas y estados de los mocks
});


describe('Basic Backend API Test', () => {
    it('should confirm the server app is defined and can be imported', () => {
        expect(app).toBeDefined(); // Solo verifica que la app Express se importa correctamente
    });

    it('should respond to a simple GET request (e.g., /testget) even if mocked', async () => {
        // Mockear una respuesta para /testget para evitar errores si no hay BD
        MockProduct.findOne.mockResolvedValue({
            _id: 'mockId',
            name: 'Mock Product'
        });

        const res = await request(app).get('/testget');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({
            _id: 'mockId',
            name: 'Mock Product'
        });
    });

    // Puedes añadir un test simple para /api/login POST si quieres
    it('should handle /api/login POST with valid credentials (mocked)', async () => {
        const mockFoundUser = {
            _id: 'user123',
            email: 'test@example.com',
            password: 'password123'
        };
        MockUser.findOne.mockResolvedValue(mockFoundUser);

        const res = await request(app)
            .post('/api/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(mockFoundUser);
    });
});
