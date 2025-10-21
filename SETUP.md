# 🚀 BigPagos Backend - Guía de Configuración

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL (Supabase)
- Credenciales de ePayco o PlacetoPay

## ⚙️ Configuración Inicial

### 1. Variables de Entorno

Copia el archivo `env.example` y renómbralo a `.env`:

```bash
cp env.example .env
```

Configura las siguientes variables en tu archivo `.env`:

```env
# Base de datos Supabase
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT Secret (cambia por uno seguro)
JWT_SECRET="tu_jwt_secret_muy_seguro_cambiar_en_produccion"

# Credenciales ePayco (sandbox)
EPAYCO_CLIENT_ID="tu_client_id"
EPAYCO_CLIENT_SECRET="tu_client_secret"
EPAYCO_PUBLIC_KEY="tu_public_key"
```

### 2. Configuración de Supabase

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Ve a Settings > Database y copia la connection string
3. Reemplaza `[YOUR-PASSWORD]` y `[YOUR-PROJECT-REF]` en la URL

### 3. Configuración de ePayco

1. Regístrate en [ePayco](https://epayco.co) 
2. Ve a tu panel de administración
3. Obtén las credenciales de sandbox:
   - Client ID
   - Client Secret  
   - Public Key

### 4. Instalación y Configuración

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Sincronizar esquema con la base de datos
npx prisma db push

# Crear usuario admin inicial
npm run db:seed
```

## 🏃‍♂️ Ejecutar el Servidor

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📚 Documentación de la API

Una vez que el servidor esté ejecutándose, puedes acceder a la documentación Swagger en:

```
http://localhost:3000/api-docs
```

## 🔐 Usuario Admin por Defecto

Después de ejecutar el seed, tendrás un usuario admin con:

- **Email:** admin@bigpagos.com
- **Password:** Admin123!

## 🧪 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar admin
- `GET /api/auth/profile` - Obtener perfil

### Clientes
- `GET /api/clientes` - Listar clientes
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes/cedula/:cedula` - Buscar por cédula

### Facturas
- `GET /api/facturas` - Listar facturas
- `POST /api/facturas` - Crear factura
- `POST /api/facturas/generate-masivas` - Generar facturas masivas

### Pagos PSE
- `POST /api/webhook/pse/create-payment` - Crear intención de pago
- `POST /api/webhook/pse/response` - Respuesta del usuario
- `POST /api/webhook/pse/confirmation` - Confirmación automática

## 🔧 Estructura del Proyecto

```
src/
├── config/           # Configuraciones
├── controllers/      # Controladores (lógica de presentación)
├── services/         # Servicios (lógica de negocio)
├── repositories/     # Repositorios (acceso a datos)
├── models/          # Modelos de datos
├── middleware/      # Middlewares personalizados
├── routes/         # Definición de rutas
├── utils/          # Utilidades
├── database/       # Configuración de base de datos
└── index.js        # Punto de entrada
```

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
- Verifica que la URL de conexión sea correcta
- Asegúrate de que Supabase esté activo
- Verifica que las credenciales sean correctas

### Error de autenticación JWT
- Verifica que JWT_SECRET esté configurado
- Asegúrate de enviar el token en el header Authorization

### Error en pagos PSE
- Verifica las credenciales de ePayco
- Asegúrate de estar usando el entorno sandbox
- Verifica que las URLs de webhook sean accesibles

## 📞 Soporte

Para soporte técnico, contacta a:
- **Email:** admin@bigpagos.com
- **Empresa:** Big Data S.A.S
