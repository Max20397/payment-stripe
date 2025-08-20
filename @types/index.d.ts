export interface Price {
  id: string;
  object: string;
  active: boolean;
  billing_scheme: string;
  created: number;
  currency: string;
  custom_unit_amount: null | unknown;
  livemode: boolean;
  lookup_key: null | string;
  metadata: Record<string, string | number | boolean | null>;
  nickname: null | string;
  product: Product;
  recurring: Recurring | null;
  tax_behavior: string;
  tiers_mode: null | string;
  transform_quantity: null | unknown;
  type: string;
  unit_amount: number;
  unit_amount_decimal: string;
}

export interface Product {
  id: string;
  object: string;
  active: boolean;
  attributes: string[];
  created: number;
  default_price: string;
  description: null | string;
  images: string[];
  livemode: boolean;
  marketing_features: string[];
  metadata: Record<string, string | number | boolean | null>;
  name: string;
  package_dimensions: null | unknown;
  shippable: null | boolean;
  statement_descriptor: null | string;
  tax_code: null | string;
  type: string;
  unit_label: null | string;
  updated: number;
  url: null | string;
}

export interface Recurring {
  interval: string;
  interval_count: number;
  meter: null | unknown;
  trial_period_days: null | number;
  usage_type: string;
}