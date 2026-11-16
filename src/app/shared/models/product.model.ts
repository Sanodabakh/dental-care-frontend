export type StockStatus = 'OK' | 'ALERTE' | 'RUPTURE' | 'PERIME';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  purchasePriceFcfa: number;
  supplier?: string;
  expirationDate?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
  quantity: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export interface ProductCreateDto {
  code: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  purchasePriceFcfa: number;
  supplier?: string;
  expirationDate?: string;
}