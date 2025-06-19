export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
}

export type Status = 'pending' | 'active' | 'completed';