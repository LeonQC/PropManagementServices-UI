// Mirrors the listings-service HTTP DTOs (ListingsService.Api/DTOs/Responses.cs).

export interface AddressResponse {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  metroArea: string | null;
  latitude: number | null;
  longitude: number | null;
  neighborhood: string | null;
}

export interface PropertyResponse {
  id: string;
  title: string;
  slug: string | null;
  propertyType: string;
  propertySubtype: string | null;
  status: string;
  totalSqft: number | null;
  leasableSqft: number | null;
  yearBuilt: number | null;
  lotSizeAcres: number | null;
  unitCount: number | null;
  askingPrice: number | null;
  capRate: number | null;
  noi: number | null;
  occupancyRate: number | null;
  marketCapRateBenchmark: number | null;
  year1NoiEstimate: number | null;
  descriptionText: string | null;
  aiSummary: string | null;
  address: AddressResponse | null;
  listedAt: string | null;
  updatedAt: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Mirrors CreatePropertyRequest / CreateAddressRequest (ListingsService.Api/DTOs/Requests.cs).
// title, propertyType and the four address lines are required; the rest are optional.
export interface CreateAddressRequest {
  street: string;
  city: string;
  state: string;
  zip: string;
  metroArea?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreatePropertyRequest {
  title: string;
  propertyType: string;
  propertySubtype?: string | null;
  status?: string | null;
  totalSqft?: number | null;
  leasableSqft?: number | null;
  yearBuilt?: number | null;
  lotSizeAcres?: number | null;
  unitCount?: number | null;
  askingPrice?: number | null;
  capRate?: number | null;
  noi?: number | null;
  occupancyRate?: number | null;
  descriptionText?: string | null;
  address: CreateAddressRequest;
}
