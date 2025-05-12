import mongoose from 'mongoose';
import 'dotenv/config';

// URL de conexão do MongoDB via variável de ambiente
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI não configurado nas variáveis de ambiente');
}

// Opções de conexão do MongoDB
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 10,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 2000,
  retryWrites: true,
  retryReads: true,
  family: 4,
  autoIndex: true, // Criar índices automaticamente
  autoCreate: true // Criar coleções automaticamente
};

// Variável para rastrear o estado da conexão
export let isConnected = false;

// Configurar eventos do Mongoose
mongoose.connection.on('connected', () => {
  console.log('Mongoose conectado ao MongoDB');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('Erro na conexão do Mongoose:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose desconectado do MongoDB');
  isConnected = false;
});

// Conectar ao MongoDB
export const connectToDatabase = async () => {
  try {
    if (isConnected) {
      return true;
    }

    const db = await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Conectado ao MongoDB com sucesso!');
    console.log('Database:', db.connection.name);
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error);
    isConnected = false;
    throw error;
  }
};

// Schema de Usuário
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

// Criar modelo do Mongoose para User
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);