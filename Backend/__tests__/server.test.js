// Backend/__tests__/server.test.js
const request = require('supertest');
const { mock, mockReset } = require('jest-mock-extended');

// Importa tu aplicación (server.js)
const app = require('../server'); // Asegúrate que la ruta sea correcta desde __tests__

// Mockear los modelos de Mongoose (User y Product)
// IMPORTANTE: Asegúrate de que las rutas a tus modelos sean correctas.
// Si User está en './models/users.js' y Product en './models/Product.js'
// Mockeamos el módulo completo, no solo la clase.
jest.mock('../models/users', () => {
    // Al mockear, necesitas devolver un objeto con las propiedades que tu código usa.
    // Para Mongoose, esto significa el método findOne, save, etc.
    const mockUser = mock(); // mockUser será una instancia mockeada de User
    mockUser.findOne = jest.fn(); // Mockea el método findOne
    mockUser.save = jest.fn().mockResolvedValue({}); // Mockea save para que siempre resuelva
    // Puedes añadir más mocks si usas otros métodos de User (ej. findById, updateOne, etc.)
    return mockUser; // Devuelve la instancia mockeada
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


// Accede a los mocks después de que el módulo haya sido mockeado.
// Esto es un poco avanzado: al mockear el módulo completo, necesitas obtener la referencia
// al mock de las funciones estáticas directamente del require.
const MockUser = require('../models/users');
const MockProduct = require('../models/Product');


// Antes de cada test, limpia los mocks para que no haya interferencias entre tests.
beforeEach(() => {
    mockReset(MockUser); // Limpia todos los mocks de MockUser
    mockReset(MockProduct); // Limpia todos los mocks de MockProduct
    // También puedes limpiar funciones específicas:
    MockUser.findOne.mockClear();
    MockUser.save.mockClear();
    MockProduct.findOne.mockClear();
});


describe('Backend API Tests', () => {

    // Test para la ruta POST /api/login - Credenciales válidas
    describe('POST /api/login', () => {
        it('should return user data for valid credentials', async () => {
            // Configura el mock para que findOne "encuentre" un usuario
            const mockFoundUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };
            MockUser.findOne.mockResolvedValue(mockFoundUser);

            const res = await request(app)
                .post('/api/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockFoundUser);
            expect(MockUser.findOne).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            });
        });

        it('should return 401 for invalid credentials', async () => {
            // Configura el mock para que findOne "no encuentre" un usuario
            MockUser.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.text).toEqual('Invalid Credentials');
            expect(MockUser.findOne).toHaveBeenCalledTimes(1);
        });

        it('should handle errors during login', async () => {
            MockUser.findOne.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/api/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200); // Tu código devuelve 200 con el error, considera cambiarlo a 500
            expect(res.body.message).toEqual('Database error'); // O el formato de error que devuelva
        });
    });

    // Test para la ruta POST /api/register
    describe('POST /api/register', () => {
        it('should register a new user successfully', async () => {
            // Configura el mock para que save "guarde" el usuario y lo devuelva
            const newUser = {
                firstName: 'New',
                lastName: 'User',
                email: 'new@example.com',
                password: 'newpassword',
                phoneNumber: '1234567890',
                imageUrl: 'http://example.com/image.jpg'
            };
            // Mockeamos la instancia del modelo para que .save() funcione
            MockUser.save.mockResolvedValue(newUser); // Este es el método que se llama en el modelo nuevo

            // Mockear la creación de la instancia User
            // Cuando haces 'new User({...})', Jest debe saber qué hacer con esa instancia
            // Esto es más complejo con Mongoose. Lo más simple es que el mock de require('../models/users')
            // devuelva una clase mockeada con su método save.
            // Para tu código, 'let registerUser = new User({...}); registerUser.save()'
            // implica que 'User' es una CLASE. Debemos mockear la CLASE.

            // La forma correcta de mockear una clase en Jest:
            const mockUserInstance = {
                save: jest.fn().mockResolvedValue(newUser) // Mockea el método save de la instancia
            };
            MockUser.mockImplementation(() => mockUserInstance); // Cuando se haga 'new User()', se usará esta instancia mockeada

            const res = await request(app)
                .post('/api/register')
                .send(newUser);

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(newUser);
            // Verifica que la instancia de User se creó y se llamó a save
            expect(MockUser).toHaveBeenCalledTimes(1); // Se llamó al constructor de User
            expect(MockUser.mock.calls[0][0]).toMatchObject({ // Los argumentos con los que se llamó al constructor
                email: 'new@example.com',
                password: 'newpassword'
            });
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1); // Se llamó a save en la instancia
        });

        it('should handle registration errors', async () => {
            const newUser = {
                firstName: 'Err',
                lastName: 'User',
                email: 'err@example.com',
                password: 'errpassword',
                phoneNumber: '123',
                imageUrl: 'http://example.com/err.jpg'
            };

            const mockUserInstance = {
                save: jest.fn().mockRejectedValue(new Error('Validation error'))
            };
            MockUser.mockImplementation(() => mockUserInstance);

            const res = await request(app)
                .post('/api/register')
                .send(newUser);

            expect(res.statusCode).toEqual(200); // Tu código devuelve 200 con el error, considera cambiarlo a 500
            // expect(res.body.message).toEqual('Validation error'); // Depende de cómo formatees el error
            // También se imprimirá en la consola de Jenkins, ya que tienes console.log("Signup: ", err)
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
        });
    });

    // Test para la ruta GET /testget
    describe('GET /testget', () => {
        it('should return product data from database', async () => {
            const mockProductData = {
                _id: '6429979b2e5434138eda1564',
                name: 'Test Product',
                price: 100
            };
            MockProduct.findOne.mockResolvedValue(mockProductData);

            const res = await request(app).get('/testget');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockProductData);
            expect(MockProduct.findOne).toHaveBeenCalledWith({
                _id: '6429979b2e5434138eda1564'
            });
        });

        it('should return null if product not found', async () => {
            MockProduct.findOne.mockResolvedValue(null);

            const res = await request(app).get('/testget');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toBeNull(); // Espera que el body sea null si no se encontró el producto
            expect(MockProduct.findOne).toHaveBeenCalledTimes(1);
        });

        it('should handle errors during product retrieval', async () => {
            MockProduct.findOne.mockRejectedValue(new Error('Product DB error'));

            const res = await request(app).get('/testget');

            // Tu código actual en /testget devuelve el error directamente con res.json(result)
            // Cuando hay un error (rejectedValue), res.json(err) enviará el objeto Error.
            expect(res.statusCode).toEqual(500); // Deberías cambiar esto a 500 para errores de servidor
            expect(res.body.message).toEqual('Product DB error');
        });
    });

    // Puedes añadir más bloques 'describe' para productRoute, storeRoute, etc.,
    // si puedes exportar tus router (ej. module.exports = router;)
    // o si puedes mockear sus dependencias.

});