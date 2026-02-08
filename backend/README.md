# Backend API - SPA Mariel

Este es el backend para la aplicación SPA Mariel, construido con Node.js, Express y MongoDB. Proporciona una API segura y robusta con autenticación JWT, gestión de roles y medidas de seguridad avanzadas.

## Características Principales

- **Autenticación y Autorización**: Registro y Login con JWT. Roles de usuario (Admin/User).
- **Seguridad Mejorada**:
  - **Helmet**: Cabeceras HTTP seguras.
  - **CORS**: Configuración de acceso cruzado.
  - **Rate Limiting**: Protección contra fuerza bruta (100 req/10 min global, 5 req/15 min login).
  - **Sanitización**: Prevención de inyección NoSQL (`express-mongo-sanitize`) y XSS (`xss-clean`).
  - **HPP**: Prevención de contaminación de parámetros HTTP.
- **Auditoría**: Registro detallado de actividades (Login, Registro, etc.) con IP y User Agent.
- **Manejo de Errores**: Centralizado y consistente.

## Tecnologías y Librerías

- **Node.js** & **Express**: Servidor web.
- **MongoDB** & **Mongoose**: Base de datos y ODM.
- **JWT (jsonwebtoken)**: Autenticación segura (Expiración: 1 hora).
- **Bcryptjs**: Hash de contraseñas.
- **Dotenv**: Gestión de variables de entorno.
- **Nodemon**: Desarrollo (reinicio automático).
- **Express-Async-Handler**: Manejo de excepciones asíncronas.
- **Seguridad**: `helmet`, `cors`, `express-rate-limit`, `xss-clean`, `express-mongo-sanitize`, `hpp`.

## Configuración e Instalación

1.  **Instalar Dependencias**:

    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz con lo siguiente:

    ```properties
    NODE_ENV=XXX
    PORT=XXX
    MONGO_URI=XXX
    JWT_SECRET=XXX

    # Credenciales para el usuario Administrador Inicial
    ADMIN_EMAIL=XXX
    ADMIN_PASSWORD=XXX
    ADMIN_NAME=XXX
    ```

3.  **Inicializar Base de Datos (Seeder)**:
    Crea el usuario administrador inicial definido en el `.env`.

    ```bash
    npm run data:import
    ```

4.  **Iniciar Servidor**:
    - **Desarrollo**: `npm run dev` (puerto 5000)
    - **Producción**: `npm start`

## Endpoints Principales

| Método   | Ruta                 | Descripción                | Acceso                   |
| :------- | :------------------- | :------------------------- | :----------------------- |
| **POST** | `/api/auth/login`    | Iniciar sesión             | Público (Rate Limited)   |
| **POST** | `/api/auth/register` | Crear nuevo usuario        | **Privado (Solo Admin)** |
| **GET**  | `/api/auth/profile`  | Obtener perfil del usuario | Privado (Token)          |

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/         # Conexión DB
│   ├── controllers/    # Lógica de rutas
│   ├── middleware/     # Auth, Errores, Logs, RateLimit
│   ├── models/         # Esquemas Mongoose (User, AuditLog)
│   ├── routes/         # Definición de rutas
│   ├── utils/          # Helpers (Tokens, Logger)
│   ├── app.js          # Configuración de Express
│   ├── server.js       # Entry point
│   └── seeder.js       # Script de carga de datos
├── .env                # Variables de entorno
└── package.json        # Dependencias
```
