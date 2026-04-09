export type FeedStockStatus = 'ok' | 'critical';
export type FeedScheduleStatus = 'Pending' | 'Done';

export interface IFeedStockCreate {
  name: string;
  brand: string;
  stockKg: number;
  unitPrice: number;
}

export interface IFeedStockUpdate {
  name?: string;
  brand?: string;
  stockKg?: number;
  unitPrice?: number;
  isActive?: boolean;
}

export interface IFeedStockQuery {
  search?: string;
  status?: FeedStockStatus;
  sortOrder?: 'asc' | 'desc';
}

export interface IFeedScheduleCreate {
  group: string;
  time: string;
  feedType: string;
  status?: FeedScheduleStatus;
  scheduleDate: Date;
}

export interface IFeedScheduleUpdate {
  group?: string;
  time?: string;
  feedType?: string;
  status?: FeedScheduleStatus;
  scheduleDate?: Date;
  isActive?: boolean;
}

export interface IFeedScheduleQuery {
  search?: string;
  status?: FeedScheduleStatus;
  date?: Date;
  sortOrder?: 'asc' | 'desc';
}

export interface IFeedSupplierCreate {
  name: string;
  contact: string;
  feedType: string;
  orders?: number;
}

export interface IFeedSupplierUpdate {
  name?: string;
  contact?: string;
  feedType?: string;
  orders?: number;
  isActive?: boolean;
}

export interface IFeedSupplierQuery {
  search?: string;
  sortOrder?: 'asc' | 'desc';
}
