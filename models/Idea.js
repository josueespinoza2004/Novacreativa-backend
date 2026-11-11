import mongoose from 'mongoose';

const ideaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  titulo: { type: String, required: true },
  servicio: { type: String, required: true },
  presupuesto: { type: String, required: true },
  tiempo: { type: String, required: true },
  detalles: { type: String, default: '' },
  estado: { type: String, default: 'Enviado a BD' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Idea', ideaSchema);