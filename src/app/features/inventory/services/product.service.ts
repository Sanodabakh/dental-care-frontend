import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import {
  Product, ProductCreateDto, StockMovement, StockStatus,
} from '../../../shared/models/product.model';

const PRODUCTS_KEY = 'dc_products';
const MOVEMENTS_KEY = 'dc_stock_movements';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _products = signal<Product[]>(this.loadProducts());
  private readonly _movements = signal<StockMovement[]>(this.loadMovements());

  readonly products = this._products.asReadonly();
  readonly movements = this._movements.asReadonly();

  list(params?: { search?: string; category?: string }): Observable<Product[]> {
    let items = [...this._products()];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
      );
    }
    if (params?.category && params.category !== 'ALL') {
      items = items.filter(p => p.category === params.category);
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return of(items).pipe(delay(200));
  }

  getById(id: string): Observable<Product | undefined> {
    return of(this._products().find(p => p.id === id)).pipe(delay(150));
  }

  create(dto: ProductCreateDto): Observable<Product> {
    const code = dto.code.trim();
    if (!code || !dto.name.trim() || !dto.category.trim()) {
      return throwError(() => new Error('Le code, le nom et la catégorie sont obligatoires.'));
    }
    if (this._products().some(p => p.code.toLowerCase() === code.toLowerCase())) {
      return throwError(() => new Error('Ce code produit existe déjà.'));
    }
    if (!this.isValidProductValues(dto.quantity, dto.minQuantity, dto.purchasePriceFcfa)) {
      return throwError(() => new Error('Vérifiez les quantités, le seuil et le prix d’achat.'));
    }
    const product: Product = {
      id: this.generateUuid(),
      ...dto,
      code,
      name: dto.name.trim(),
      category: dto.category.trim(),
      createdAt: new Date().toISOString(),
    };
    this._products.update(list => [product, ...list]);
    this.saveProducts();
    return of(product).pipe(delay(300));
  }

  update(id: string, dto: Partial<ProductCreateDto>): Observable<Product> {
    const existing = this._products().find(p => p.id === id);
    if (!existing) return throwError(() => new Error('Produit introuvable.'));
    const code = dto.code?.trim();
    if (dto.code !== undefined && !code) {
      return throwError(() => new Error('Le code produit est obligatoire.'));
    }
    if (code && this._products().some(
      product => product.id !== id && product.code.toLowerCase() === code.toLowerCase(),
    )) {
      return throwError(() => new Error('Ce code produit existe déjà.'));
    }
    const updated: Product = {
      ...existing,
      ...dto,
      ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
    };
    if (!this.isValidProductValues(
      updated.quantity,
      updated.minQuantity,
      updated.purchasePriceFcfa,
    )) {
      return throwError(() => new Error('Vérifiez les quantités, le seuil et le prix d’achat.'));
    }
    this._products.update(list => list.map(p => p.id === id ? updated : p));
    this.saveProducts();
    return of(updated).pipe(delay(300));
  }

  addMovement(payload: {
    productId: string;
    type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
    quantity: number;
    reason?: string;
  }): Observable<StockMovement> {
    const product = this._products().find(p => p.id === payload.productId);
    if (!product) return throwError(() => new Error('Produit introuvable.'));
    if (!Number.isFinite(payload.quantity) ||
      payload.quantity < 0 ||
      (payload.type !== 'AJUSTEMENT' && payload.quantity === 0)) {
      return throwError(() => new Error('La quantité du mouvement est invalide.'));
    }

    // Calcul nouvelle quantité
    let newQty = product.quantity;
    if (payload.type === 'ENTREE') newQty += payload.quantity;
    else if (payload.type === 'SORTIE') {
      if (payload.quantity > product.quantity) {
        return throwError(() => new Error('Quantité insuffisante en stock.'));
      }
      newQty -= payload.quantity;
    } else newQty = payload.quantity;

    // Mise à jour produit
    const updatedProduct: Product = { ...product, quantity: newQty };
    this._products.update(list => list.map(p => p.id === product.id ? updatedProduct : p));
    this.saveProducts();

    // Enregistrement mouvement
    const movement: StockMovement = {
      id: this.generateUuid(),
      productId: product.id,
      productName: product.name,
      type: payload.type,
      quantity: payload.quantity,
      reason: payload.reason,
      createdAt: new Date().toISOString(),
      createdBy: 'Dr. Omar Fall',
    };
    this._movements.update(list => [movement, ...list]);
    this.saveMovements();

    return of(movement).pipe(delay(250));
  }

  getStatus(p: Product): StockStatus {
    const today = new Date().toISOString().slice(0, 10);
    if (p.expirationDate && p.expirationDate < today) return 'PERIME';
    if (p.quantity === 0) return 'RUPTURE';
    if (p.quantity <= p.minQuantity) return 'ALERTE';
    return 'OK';
  }

  private isValidProductValues(quantity: number, minQuantity: number, price: number): boolean {
    return Number.isFinite(quantity) && quantity >= 0 &&
      Number.isFinite(minQuantity) && minQuantity >= 0 &&
      Number.isFinite(price) && price >= 0;
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private loadProducts(): Product[] {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
    const seed = this.getSeedProducts();
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(seed));
    return seed;
  }

  private loadMovements(): StockMovement[] {
    const raw = localStorage.getItem(MOVEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveProducts(): void {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(this._products()));
  }

  private saveMovements(): void {
    localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(this._movements()));
  }

  private getSeedProducts(): Product[] {
    return [
      { id: 'p1', code: 'PRD-001', name: 'Gants nitrile (boîte 100)', category: 'Protection', quantity: 3, minQuantity: 10, purchasePriceFcfa: 5000, supplier: 'Dentapro', expirationDate: '2027-06-30', createdAt: new Date().toISOString() },
      { id: 'p2', code: 'PRD-002', name: 'Masques chirurgicaux (boîte 50)', category: 'Protection', quantity: 8, minQuantity: 5, purchasePriceFcfa: 3000, supplier: 'Dentapro', createdAt: new Date().toISOString() },
      { id: 'p3', code: 'PRD-003', name: 'Anesthésique Lidocaïne', category: 'Médicaments', quantity: 5, minQuantity: 10, purchasePriceFcfa: 8000, supplier: 'PharmaDent', expirationDate: '2026-12-31', createdAt: new Date().toISOString() },
      { id: 'p4', code: 'PRD-004', name: 'Résine composite A2', category: 'Restauration', quantity: 12, minQuantity: 5, purchasePriceFcfa: 15000, supplier: 'Dentapro', createdAt: new Date().toISOString() },
      { id: 'p5', code: 'PRD-005', name: 'Compresses stériles', category: 'Protection', quantity: 20, minQuantity: 10, purchasePriceFcfa: 2000, supplier: 'Dentapro', createdAt: new Date().toISOString() },
      { id: 'p6', code: 'PRD-006', name: 'Aiguilles dentaires', category: 'Instruments', quantity: 50, minQuantity: 20, purchasePriceFcfa: 12000, supplier: 'Dentapro', createdAt: new Date().toISOString() },
      { id: 'p7', code: 'PRD-007', name: 'Solution désinfectante', category: 'Hygiène', quantity: 2, minQuantity: 5, purchasePriceFcfa: 7500, supplier: 'PharmaDent', createdAt: new Date().toISOString() },
    ];
  }
}