export type UserType = {
  id: string;
  name: string;
};

export type ProductType = {
  id: string;
  title: string;
};

export type OrderType = {
  id: string;
  items: ProductType[];
};