import { BaseCityAdapter } from './base-adapter';
import { withRetry } from '@/lib/utils/retry';
import type { RawPermitBatch, FetchOptions, CityAdapterConfig } from '@/types';

const DEFAULT_PAGE_SIZE = 10000;

export abstract class SocrataAdapter extends BaseCityAdapter {
  protected pageSize: number;
  protected orderField: string;

  constructor(
    config: CityAdapterConfig,
    options: { pageSize?: number; orderField?: string } = {}
  ) {
    super(config);
    this.pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
    this.orderField = options.orderField || ':id';
  }

  protected buildUrl(offset: number, limit: number, since?: Date): string {
    const baseUrl = `${this.config.apiBaseUrl}/${this.config.datasetId}.json`;
    const params = new URLSearchParams({
      $limit: limit.toString(),
      $offset: offset.toString(),
      $order: this.orderField,
    });

    if (since) {
      const isoDate = since.toISOString().split('T')[0];
      params.set('$where', `${this.getDateField()} > '${isoDate}'`);
    }

    if (this.config.apiToken) {
      params.set('$$app_token', this.config.apiToken);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  protected getDateField(): string {
    return 'issue_date';
  }

  async *fetchPermits(options: FetchOptions): AsyncGenerator<RawPermitBatch> {
    let offset = options.offset || 0;
    const limit = options.limit || this.pageSize;
    let hasMore = true;

    while (hasMore) {
      const url = this.buildUrl(offset, limit, options.since);

      const records = await withRetry(async () => {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Socrata API error: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<unknown[]>;
      });

      hasMore = records.length === limit;

      yield {
        records,
        hasMore,
        nextOffset: hasMore ? offset + limit : undefined,
        totalRecords: undefined,
      };

      offset += limit;
    }
  }
}
