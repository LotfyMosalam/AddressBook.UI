import { PaginationParams } from './pagination.models';

export interface AddressEntryDto {
  id: string;
  fullName: string;
  jobId: string;
  jobName: string;
  departmentId: string;
  departmentName: string;
  mobileNumber: string;
  dateOfBirth: string;
  age: number;
  address: string;
  email: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AddressEntryListItemDto {
  id: string;
  fullName: string;
  jobName: string;
  departmentName: string;
  mobileNumber: string;
  email: string;
  age: number;
  photoUrl?: string;
}

export interface CreateAddressEntryRequest {
  fullName: string;
  jobId: string;
  departmentId: string;
  mobileNumber: string;
  dateOfBirth: string;
  address: string;
  email: string;
  password: string;
}

export interface UpdateAddressEntryRequest {
  fullName: string;
  jobId: string;
  departmentId: string;
  mobileNumber: string;
  dateOfBirth: string;
  address: string;
  email: string;
}

export interface GetEntriesParams extends PaginationParams {}

export interface SearchEntriesParams extends PaginationParams {
  searchTerm?: string;
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  address?: string;
  jobId?: string;
  departmentId?: string;
  dobFrom?: string;
  dobTo?: string;
}
