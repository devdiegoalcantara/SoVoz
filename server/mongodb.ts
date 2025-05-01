import mongoose from 'mongoose';

// URL de conexão do MongoDB fornecida pelo usuário
const MONGODB_URI = "mongodb+srv://devdiegoalcantara:diego58205820@cluster0.8pyyf6p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Conectar ao MongoDB
export const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado ao MongoDB com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error);
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