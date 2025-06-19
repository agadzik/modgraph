import { User, Product } from '~/types';
import { Logger } from '@utils/logger';

const logger = new Logger('Validator');

export function validateUser(user: Partial<User>): user is User {
  const isValid = !!(user.id && user.name && user.email);
  if (!isValid) {
    logger.error('Invalid user object');
  }
  return isValid;
}

export function validateProduct(product: Partial<Product>): product is Product {
  const isValid = !!(product.id && product.title && typeof product.price === 'number');
  if (!isValid) {
    logger.error('Invalid product object');
  }
  return isValid;
}