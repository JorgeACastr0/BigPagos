require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // PSE Gateway configuration
  pse: {
    // ePayco configuration
    epayco: {
      clientId: process.env.EPAYCO_CLIENT_ID,
      clientSecret: process.env.EPAYCO_CLIENT_SECRET,
      sandboxUrl: process.env.EPAYCO_SANDBOX_URL,
      publicKey: process.env.EPAYCO_PUBLIC_KEY,
    },
    
    // PlacetoPay configuration (alternative)
    placetopay: {
      login: process.env.PLACETOPAY_LOGIN,
      tranKey: process.env.PLACETOPAY_TRANKEY,
      url: process.env.PLACETOPAY_URL,
    },
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  
  // File upload configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

module.exports = config;
