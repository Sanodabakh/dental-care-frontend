import { Injectable } from '@angular/core';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { apiError } from '../../../core/services/api-error';
import {
  Product, ProductCreateDto, StockMovement, StockStatus,
} from '../../../shared/models/product.model';

interface ProductDto {
  id: string;
  code: string;
  name: string;
  category?: string;
  quantity: number;
  minQuantity: number;
  purchasePriceFcfa?: number;
  supplier?: string;
  expirationDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) {}

  list(params?: { search?: string; category?: string }): Observable<Product[]> {
    return this.api.getPage<ProductDto>('/products', {
      search: params?.search?.trim() || undefined,
      size: 1000,
    }).pipe(
      map(page => page.items
        .map(item => this.toModel(item))
        .filter(product => !params?.category || params.category === 'ALL' || product.category === params.category)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getById(id: string): Observable<Product> {
    return this.api.get<ProductDto>(`/products/${id}`).pipe(
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  create(dto: ProductCreateDto): Observable<Product> {
    return this.api.post<ProductDto>('/products', {
      code: dto.code,
      name: dto.name,
      category: dto.category,
      quantity: dto.quantity,
      minQuantity: dto.minQuantity,
      purchasePriceFcfa: dto.purchasePriceFcfa,
      supplier: dto.supplier,
      expirationDate: dto.expirationDate,
    }).pipe(
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  update(id: string, dto: Partial<ProductCreateDto>): Observable<Product> {
    return this.getById(id).pipe(
      switchMap(existing => this.api.put<ProductDto>(`/products/${id}`, {
        code: dto.code ?? existing.code,
        name: dto.name ?? existing.name,
        category: dto.category ?? existing.category,
        minQuantity: dto.minQuantity ?? existing.minQuantity,
        purchasePriceFcfa: dto.purchasePriceFcfa ?? existing.purchasePriceFcfa,
        supplier: dto.supplier ?? existing.supplier,
        expirationDate: dto.expirationDate ?? existing.expirationDate,
      })),
      map(item => this.toModel(item)),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  addMovement(payload: {
    productId: string;
    type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
    quantity: number;
    reason?: string;
  }): Observable<StockMovement> {
    return this.api.post<{
      id: string; productId: string; type: StockMovement['type']; quantity: number;
      reason?: string; createdBy: string; createdAt: string;
    }>(`/products/${payload.productId}/movements`, {
      type: payload.type,
      quantity: payload.quantity,
      reason: payload.reason,
    }).pipe(
      map(movement => ({
        id: movement.id,
        productId: movement.productId,
        productName: '',
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        createdBy: movement.createdBy,
        createdAt: movement.createdAt,
      })),
      catchError(error => throwError(() => apiError(error))),
    );
  }

  getStatus(product: Product): StockStatus {
    const today = new Date().toISOString().slice(0, 10);
    if (product.expirationDate && product.expirationDate < today) return 'PERIME';
    if (product.quantity === 0) return 'RUPTURE';
    if (product.quantity <= product.minQuantity) return 'ALERTE';
    return 'OK';
  }

  private toModel(dto: ProductDto): Product {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      category: dto.category ?? '',
      quantity: dto.quantity,
      minQuantity: dto.minQuantity,
      purchasePriceFcfa: dto.purchasePriceFcfa ?? 0,
      supplier: dto.supplier,
      expirationDate: dto.expirationDate,
      createdAt: '',
    };
  }
}
