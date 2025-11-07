export interface Balances {
  stock: number;
  cash: number;
}

export interface User {
  id: string;
  name: string;
  balances: Balances;
}

export interface Order {
  userId: string;
  price: number;
  quantity: number;
}

export interface UserOrder {
  side: "bid" | "ask";
  userId: string;
  price: number;
  quantity: number;
}

export interface AnonyOrder {
  price: number;
  size: number;
}

export interface Orderbook {
  asks: AnonyOrder[];
  bids: AnonyOrder[];
}

export interface Chart {
  timestamp: Date;
  open: number;
  high: number;
  close: number;
  low: number;
}
