export interface LocationData {
  country?: string;
  state?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  road?: string;
  postcode?: string;
  formatted?: string;
  loading: boolean;
  error?: string;
}
