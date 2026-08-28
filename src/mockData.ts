import { ServiceOrder } from './types';

export const generateMockOrders = (lat: number, lng: number): ServiceOrder[] => [
  {
    id: 'OS-8921',
    type: 'Reparo',
    status: 'pendente',
    client: 'João Silva',
    address: 'Endereço Próximo 1',
    location: { lat: lat + 0.015, lng: lng + 0.01 }, // Dynamic
    description: 'Cliente relata luz vermelha no PON da ONU. Sem acesso à internet desde ontem.',
    equipment: ['Máquina de Fusão', 'Clivador', 'Bobina Drop', 'Conectores APC', 'Escada'],
    priority: 'Alta',
    distance: '1.5 km',
    time: '5 min'
  },
  {
    id: 'OS-8922',
    type: 'Instalação',
    status: 'pendente',
    client: 'Maria Oliveira',
    address: 'Endereço Próximo 2',
    location: { lat: lat - 0.012, lng: lng - 0.015 }, // Dynamic
    description: 'Nova instalação de plano 500Mbps residencial.',
    equipment: ['Roteador Wi-Fi 6', 'ONU', 'Bobina Drop', 'Escada', 'Fibraclip'],
    priority: 'Média',
    distance: '2.2 km',
    time: '8 min'
  },
  {
    id: 'OS-8923',
    type: 'Vistoria',
    status: 'pendente',
    client: 'Mercado Bom Preço',
    address: 'Endereço Próximo 3',
    location: { lat: lat + 0.005, lng: lng - 0.008 }, // Dynamic
    description: 'Vistoria para viabilidade técnica de link dedicado.',
    equipment: ['EPI Padrão', 'Prancheta', 'Câmera'],
    priority: 'Baixa',
    distance: '1.1 km',
    time: '4 min'
  }
];
