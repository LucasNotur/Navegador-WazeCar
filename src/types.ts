export interface ServiceOrder {
  id: string;
  type: 'Instalação' | 'Reparo' | 'Vistoria';
  status: 'pendente' | 'em_andamento' | 'concluida';
  client: string;
  address: string;
  location: { lat: number; lng: number };
  description: string;
  equipment: string[];
  priority: 'Alta' | 'Média' | 'Baixa';
  distance?: string;
  time?: string;
}
