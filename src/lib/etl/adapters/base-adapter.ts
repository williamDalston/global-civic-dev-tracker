import type { RawPermitBatch, FetchOptions, UniversalPermit, CityAdapterConfig } from '@/types';

export abstract class BaseCityAdapter {
  protected config: CityAdapterConfig;

  constructor(config: CityAdapterConfig) {
    this.config = config;
  }

  get citySlug(): string {
    return this.config.citySlug;
  }

  get cityId(): number {
    return this.config.cityId;
  }

  abstract fetchPermits(options: FetchOptions): AsyncGenerator<RawPermitBatch>;
  abstract transformToUniversal(raw: unknown): UniversalPermit | null;
}
