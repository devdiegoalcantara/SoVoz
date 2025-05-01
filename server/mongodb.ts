import mongoose from 'mongoose';

// URL de conexão do MongoDB via variável de ambiente
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI não configurado nas variáveis de ambiente');
}

// Opções de conexão do MongoDB
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Variável para rastrear o estado da conexão
export let isConnected = false;

// Conectar ao MongoDB
export const connectToDatabase = async () => {
  try {
    if (isConnected) {
      return true;
    }

    const options = {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true
    };
    
    const db = await mongoose.connect(MONGODB_URI, options);
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
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// Schema de Ticket
const ticketSchema = new mongoose.Schema({
  sequentialId: { type: Number, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, default: 'Novo' },
  submitterName: { type: String },
  submitterEmail: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachmentPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Criar modelos do Mongoose
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);