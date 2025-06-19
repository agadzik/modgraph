import { Product } from '~/types';
import { validateProduct } from '~/utils/validator';
import { Logger } from '~/utils/logger';
import { config } from '#config';

const logger = new Logger('ProductService');

export class ProductService {
  async getProduct(id: string): Promise<Product | null> {
    logger.log(`Fetching product ${id}`);
    
    const response = await fetch(`${config.apiUrl}/products/${id}`);
    const product = await response.json();
    
    if (validateProduct(product)) {
      return product;
    }
    
    return null;
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    logger.log(`Searching products: ${query}`, 'active');
    // Implementation here
    return [];
  }
}