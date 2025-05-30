const mongoose = require("mongoose");

// Importar modelos (asegúrate que las rutas sean correctas desde la ubicación de seed.js)
const User = require("./models/users");
const Product = require("./models/Product");
const Store = require("./models/store");
const Purchase = require("./models/purchase");
const Sales = require("./models/sales");

const uri = "mongodb://localhost:27017/InventoryManagementApp?retryWrites=true&w=majority";

// --- Funciones auxiliares para generación de datos ---
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomElement = (arr) => {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
};

const generateRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log("MongoDB conectado para el sembrado de datos...");
    } catch (err) {
        console.error("Error de conexión a MongoDB:", err.message);
        process.exit(1);
    }
};

const clearDatabase = async () => {
    console.log("Limpiando la base de datos...");
    try {
        await User.deleteMany({});
        await Product.deleteMany({});
        await Store.deleteMany({});
        await Purchase.deleteMany({});
        await Sales.deleteMany({});
        console.log("Base de datos limpiada.");
    } catch (error) {
        console.error("Error limpiando la base de datos:", error);
        throw error;
    }
};

// Nueva función para crear/asegurar un usuario específico
const ensureSpecificUser = async (userData) => {
    let user = await User.findOne({ email: userData.email });
    if (user) {
        console.log(`Usuario específico ${userData.email} ya existe. Usando el existente.`);
        // En un seeder, si clearDatabase() está activo, este bloque no se ejecutará a menudo.
        // Si se quisiera actualizar la contraseña (que está en texto plano aquí):
        // if (user.password !== userData.password) {
        //     user.password = userData.password;
        //     await user.save();
        //     console.log(`Contraseña del usuario ${userData.email} actualizada (solo para fines de seeder).`);
        // }
    } else {
        user = await User.create({
            firstName: userData.firstName || "Usuario",
            lastName: userData.lastName || "PorDefecto",
            email: userData.email,
            password: userData.password, // Contraseña en texto plano para el seeder
            phoneNumber: userData.phoneNumber || `${getRandomInt(100, 999)}-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
            imageUrl: userData.imageUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(userData.email)}`,
        });
        console.log(`Usuario específico ${user.email} creado.`);
    }
    return [user]; // Devolver en un array para consistencia con otras funciones seed
};

const seedUsers = async (count = 100) => {
    const users = [];
    const firstNames = ["Alice", "Bob", "Charlie", "David", "Eve", "Fiona", "George", "Hannah", "Ian", "Julia", "Kevin", "Laura", "Mike", "Nora", "Oscar"];
    const lastNames = ["Smith", "Jones", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"];
    const domains = ["example.com", "mail.com", "test.org", "web.dev", "data.net"];

    for (let i = 0; i < count; i++) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        users.push({
            firstName: firstName,
            lastName: lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${getRandomElement(domains)}`,
            password: `pass${getRandomInt(1000, 9999)}word`, // Contraseña simple
            phoneNumber: `${getRandomInt(100, 999)}-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
            imageUrl: `https://i.pravatar.cc/150?u=${firstName}${lastName}${i}`, // Placeholder de imagen
        });
    }
    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} usuarios creados.`);
    return createdUsers;
};

const seedProducts = async (users, count = 100) => {
    const products = [];
    if (users.length === 0) {
        console.warn("No hay usuarios para asignar a los productos. Creando productos sin userID.");
        // Opcionalmente, podrías decidir no crear productos si no hay usuarios:
        // console.error("No hay usuarios para asignar a los productos. Abortando creación de productos.");
        // return [];
    }

    const productNames = ["Laptop Pro", "Gaming Mouse", "Mechanical Keyboard", "4K Monitor", "HD Webcam", "Noise-Cancelling Headphones", "1TB SSD", "GeForce RTX 4090", "Intel Core i9", "32GB DDR5 RAM", "Smartphone X", "Tablet Lite"];
    const manufacturers = ["AlphaTech", "BetaGadgets", "GammaCorp", "DeltaElec", "EpsilonSys", "ZetaDevices"];
    const descriptions = [
        "A top-tier product with excellent features.", "High performance and reliability for everyday use.",
        "Built with the latest technology.", "Durable and user-friendly design.", "Ideal for professionals and enthusiasts.",
        "Enhance your productivity and entertainment.", "Compact and powerful."
    ];

    for (let i = 0; i < count; i++) {
        products.push({
            userID: users.length > 0 ? getRandomElement(users)._id : null,
            name: `${getRandomElement(productNames)} v${i % 5 + 1}.${i % 10}`,
            manufacturer: getRandomElement(manufacturers),
            stock: 0, // El stock inicial es 0, se actualizará con las compras
            description: getRandomElement(descriptions),
        });
    }
    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} productos creados.`);
    return createdProducts;
};

const seedStores = async (users, count = 100) => {
    const stores = [];
    if (users.length === 0) {
        console.warn("No hay usuarios para asignar a las tiendas. Creando tiendas sin userID.");
    }

    const storeNamePrefixes = ["Grand", "Central", "Digital", "Urban", "Value", "Peak", "Future"];
    const storeNameSuffixes = ["Hub", "Emporium", "World", "Zone", "Place", "Retail", "Solutions"];
    const categories = ["Electronics", "Computers", "Gadgets", "Mobile", "Home Appliances", "Tech Accessories"];
    const cities = ["Metro City", "Techville", "Innovate Burg", "Silicon Valley", "Cyber Town", "Gadgetburg"];
    const streetNames = ["Main", "Oak", "Pine", "Maple", "Cedar", "Elm", "Washington", "Lake", "Hill", "Park", "Innovation", "Technology"];
    const streetSuffixes = ["St", "Ave", "Rd", "Blvd", "Ln", "Dr", "Way"];

    for (let i = 0; i < count; i++) {
        stores.push({
            userID: users.length > 0 ? getRandomElement(users)._id : null,
            name: `${getRandomElement(storeNamePrefixes)} ${getRandomElement(categories)} ${getRandomElement(storeNameSuffixes)} #${i + 1}`,
            category: getRandomElement(categories),
            address: `${getRandomInt(1, 9999)} ${getRandomElement(streetNames)} ${getRandomElement(streetSuffixes)}`,
            city: getRandomElement(cities),
            image: `https://picsum.photos/seed/store${i}/400/300`, // Placeholder de imagen para tiendas
        });
    }
    const createdStores = await Store.insertMany(stores);
    console.log(`${createdStores.length} tiendas creadas.`);
    return createdStores;
};

const seedPurchases = async (users, products, count = 100) => {
    const purchasesData = [];
    if (users.length === 0 || products.length === 0) {
        console.error("No hay usuarios o productos para crear compras. Abortando creación de compras.");
        return [];
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const today = new Date();

    for (let i = 0; i < count; i++) {
        const product = getRandomElement(products);
        const quantityPurchased = getRandomInt(20, 150);
        const unitPurchasePrice = getRandomInt(5, 50); // Precio unitario de compra
        purchasesData.push({
            userID: getRandomElement(users)._id,
            ProductID: product._id,
            QuantityPurchased: quantityPurchased,
            PurchaseDate: formatDate(generateRandomDate(oneYearAgo, today)),
            TotalPurchaseAmount: parseFloat((quantityPurchased * unitPurchasePrice).toFixed(2)),
        });
    }

    // Actualizar el stock de productos basado en las compras
    for (const purchase of purchasesData) {
        await Product.findByIdAndUpdate(purchase.ProductID, {
            $inc: { stock: purchase.QuantityPurchased }
        });
    }

    const createdPurchases = await Purchase.insertMany(purchasesData);
    console.log(`${createdPurchases.length} compras creadas y stocks de productos actualizados.`);
    return createdPurchases;
};

const seedSales = async (users, products, stores, count = 100) => {
    if (users.length === 0 || products.length === 0 || stores.length === 0) {
        console.error("No hay usuarios, productos o tiendas para crear ventas. Abortando creación de ventas.");
        return [];
    }

    const salesToCreate = [];
    const recentDays = 360;
    const today = new Date();
    const startDateForSales = new Date();
    startDateForSales.setDate(today.getDate() - recentDays);

    for (let i = 0; i < count; i++) {
        const productForSale = getRandomElement(products); // Podría ser un producto con stock 0 inicialmente
        const store = getRandomElement(stores);
        const user = getRandomElement(users)._id;

        const currentProductState = await Product.findById(productForSale._id);
        if (!currentProductState || currentProductState.stock <= 0) {
            // console.warn(`Producto ${productForSale.name} (ID: ${productForSale._id}) sin stock o no encontrado. Omitiendo venta.`);
            continue; // Omitir si no hay stock o el producto no se encuentra
        }

        const stockSold = getRandomInt(1, Math.max(1, currentProductState.stock)); // Vender como máximo el stock disponible
        const unitSalePrice = getRandomInt(Math.max(10, currentProductState.stock > 0 ? 7 : 10), 70); // Precio unitario de venta, mayor que el de compra

        // Actualizar el stock del producto INMEDIATAMENTE
        await Product.findByIdAndUpdate(currentProductState._id, {
            $inc: { stock: -stockSold }
        });

        salesToCreate.push({
            userID: user,
            ProductID: currentProductState._id,
            StoreID: store._id,
            StockSold: stockSold,
            SaleDate: formatDate(generateRandomDate(startDateForSales, today)),
            TotalSaleAmount: parseFloat((stockSold * unitSalePrice).toFixed(2)),
        });
    }
    
    if (salesToCreate.length > 0) {
        const createdSales = await Sales.insertMany(salesToCreate);
        console.log(`${createdSales.length} ventas creadas y stocks de productos actualizados.`);
        return createdSales;
    } else {
        console.log("No se crearon ventas válidas después de las comprobaciones de stock.");
        return [];
    }
};


const seedDatabase = async () => {
    await connectDB();
    
    // Descomenta la siguiente línea si quieres limpiar la BD cada vez que ejecutes el script
    // Por defecto, está activa para asegurar un estado limpio para el usuario específico.
    await clearDatabase();

    const specificUserDetails = {
        email: "hpablobenja@gmail.com",
        password: "2472040", // Contraseña en texto plano como se solicitó
        firstName: "Benjamin", // Puedes cambiar estos si quieres
        lastName: "Pablo"
    };
    const specificUserArray = await ensureSpecificUser(specificUserDetails);

    if (!specificUserArray || specificUserArray.length === 0 || !specificUserArray[0]) {
        console.error("Error crítico: No se pudo crear o encontrar el usuario específico. Abortando el sembrado.");
        await mongoose.disconnect();
        process.exit(1); // Salir si el usuario base no se puede procesar
    }

    // Ya no necesitamos generar 100 usuarios aleatorios, usaremos el específico.
    // const users = await seedUsers(100); // Comentado o eliminado

    // Es importante tener productos con stock inicial 0, que luego se incrementa con las compras
    // Todas las siguientes funciones usarán 'specificUserArray'
    let products = await seedProducts(specificUserArray, 100);
    const stores = await seedStores(specificUserArray, 100);

    if (products.length > 0) { // specificUserArray siempre tendrá un usuario aquí
      await seedPurchases(specificUserArray, products, 100);
      // Volver a cargar los productos para obtener el stock actualizado después de las compras
      // Filtrar por el userID del usuario específico para mayor precisión
      products = await Product.find({ userID: specificUserArray[0]._id });
    } else {
        console.warn("No se crearon productos. Por lo tanto, no se crearán compras ni ventas relacionadas con productos.");
    }
    
    if (products.length > 0 && stores.length > 0) { // specificUserArray siempre tendrá un usuario aquí
      await seedSales(specificUserArray, products, stores, 100);
    } else {
        console.warn("No se crearon suficientes productos o tiendas. Por lo tanto, no se crearán ventas.");
    }

    console.log(`Sembrado de base de datos completado para el usuario: ${specificUserDetails.email}`);
    await mongoose.disconnect();
    console.log("MongoDB desconectado.");
};

seedDatabase().catch(err => {
    console.error("Error durante el sembrado de la base de datos:", err);
    mongoose.disconnect().then(() => {
        process.exit(1);
    });
});