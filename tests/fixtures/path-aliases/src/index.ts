// Main entry point that uses various path aliases
import { UserService } from '@services/userService';
import { ProductService } from '@services/productService';
import { Logger } from '@utils/logger';
import { validateUser, validateProduct } from '@utils/validator';
import { config, features } from '#config';
import type { User, Product, Status } from '#types';

// Also import components
import { UserCard } from '@components/UserCard';
import { ProductList } from '@components/ProductList';

// Mix of different alias styles
import { User as UserType } from '~/types';
import { config as appConfig } from '~/config';

const logger = new Logger('Main');

export async function main() {
  logger.log('Starting application', 'pending');
  
  const userService = new UserService();
  const productService = new ProductService();
  
  // Use the services
  const user = await userService.getUser('123');
  const product = await productService.getProduct('456');
  
  logger.log('Application started', 'active');
}

// Export for visibility
export {
  UserService,
  ProductService,
  UserCard,
  ProductList,
  validateUser,
  validateProduct,
  config,
  features
};