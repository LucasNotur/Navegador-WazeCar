import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "silicon-ethos-hq6d2",
  appId: "1:856724831299:web:14658a7fac1f7f265128f6",
  apiKey: "AIzaSyAbQgTPf-0enEq9k4nBNz9uVH9HF2j3Qx0",
  authDomain: "silicon-ethos-hq6d2.firebaseapp.com",
  storageBucket: "silicon-ethos-hq6d2.firebasestorage.app",
  messagingSenderId: "856724831299",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-astrumevnavigato-6c4f0e66-0071-4e43-831c-8b916d3f52c6");

const baseLat = -22.8461;
const baseLng = -43.5245;

const ctos = [
  {
    id: `CTO-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'Instalação',
    status: 'pendente',
    client: 'CTO 01 - Bangu',
    address: 'Travessa Chico Mendes, Bangu, RJ (CEP: 21853-030)',
    location: { lat: baseLat + 0.001, lng: baseLng + 0.001 },
    description: 'Instalação de nova Caixa de Terminação Óptica (CTO) no poste 1.',
    equipment: ['Fibra Óptica', 'Caixa CTO 16 portas', 'Alça Preformada'],
    priority: 'Alta'
  },
  {
    id: `CTO-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'Instalação',
    status: 'pendente',
    client: 'CTO 02 - Bangu',
    address: 'Travessa Chico Mendes, Bangu, RJ (CEP: 21853-030)',
    location: { lat: baseLat - 0.0015, lng: baseLng + 0.0005 },
    description: 'Instalação de nova Caixa de Terminação Óptica (CTO) no poste 2.',
    equipment: ['Fibra Óptica', 'Caixa CTO 16 portas', 'Alça Preformada'],
    priority: 'Média'
  },
  {
    id: `CTO-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'Instalação',
    status: 'pendente',
    client: 'CTO 03 - Bangu',
    address: 'Travessa Chico Mendes, Bangu, RJ (CEP: 21853-030)',
    location: { lat: baseLat + 0.0008, lng: baseLng - 0.0012 },
    description: 'Instalação de nova Caixa de Terminação Óptica (CTO) no poste 3.',
    equipment: ['Fibra Óptica', 'Caixa CTO 16 portas', 'Alça Preformada'],
    priority: 'Média'
  },
  {
    id: `CTO-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'Reparo',
    status: 'pendente',
    client: 'CTO 04 - Bangu',
    address: 'Travessa Chico Mendes, Bangu, RJ (CEP: 21853-030)',
    location: { lat: baseLat - 0.0005, lng: baseLng - 0.0015 },
    description: 'Manutenção preventiva e troca de conectores oxidados.',
    equipment: ['Conectores APC', 'Sangrador de Tubo', 'Limpador Óptico'],
    priority: 'Alta'
  },
  {
    id: `CTO-${Math.floor(1000 + Math.random() * 9000)}`,
    type: 'Vistoria',
    status: 'pendente',
    client: 'CTO 05 - Bangu',
    address: 'Travessa Chico Mendes, Bangu, RJ (CEP: 21853-030)',
    location: { lat: baseLat + 0.002, lng: baseLng - 0.0005 },
    description: 'Vistoria de viabilidade de rede para expansão de CTO.',
    equipment: ['Medidor de Potência (Power Meter)', 'Caneta Óptica (VFL)'],
    priority: 'Baixa'
  }
];

async function seedCTOs() {
  const batch = writeBatch(db);
  ctos.forEach(cto => {
    const docRef = doc(db, 'service_orders', cto.id);
    batch.set(docRef, cto);
  });
  await batch.commit();
  console.log("5 CTOs inserted successfully!");
}

seedCTOs().catch(console.error).finally(() => process.exit(0));
