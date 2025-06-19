import React from 'react';
import { Product } from '~/types';
import { ProductService } from '@services/productService';
import { Logger } from '~/utils/logger';

const logger = new Logger('ProductList');

export const ProductList: React.FC = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const productService = new ProductService();
  
  const handleSearch = async (query: string) => {
    logger.log(`Searching for: ${query}`, 'pending');
    const results = await productService.searchProducts(query);
    setProducts(results);
    logger.log(`Found ${results.length} products`, 'completed');
  };
  
  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.title}</h3>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
};