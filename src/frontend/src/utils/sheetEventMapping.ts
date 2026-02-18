import type { Event, Service } from '../backend';

export interface ColumnMapping {
  title?: string;
  dateTimestamp?: string;
  attendees?: string;
  pricePerPerson?: string;
  flatFee?: string;
  amountPaid?: string;
  services?: string;
}

export interface MappingResult {
  success: boolean;
  event?: Event;
  error?: string;
}

export function mapCSVRowToEvent(
  row: string[],
  headers: string[],
  mapping: ColumnMapping,
  externalIdColumn?: string
): MappingResult {
  try {
    const getValue = (field: keyof ColumnMapping): string => {
      const columnName = mapping[field];
      if (!columnName) return '';
      const index = headers.indexOf(columnName);
      return index >= 0 ? row[index]?.trim() || '' : '';
    };

    const title = getValue('title');
    if (!title) {
      return { success: false, error: 'Title is required' };
    }

    const dateStr = getValue('dateTimestamp');
    if (!dateStr) {
      return { success: false, error: 'Date is required' };
    }

    const dateTimestamp = parseDateToTimestamp(dateStr);
    if (!dateTimestamp) {
      return { success: false, error: `Invalid date format: ${dateStr}` };
    }

    const attendees = BigInt(parseInt(getValue('attendees')) || 0);
    const pricePerPerson = BigInt(parseInt(getValue('pricePerPerson')) || 0);
    const flatFee = getValue('flatFee') ? BigInt(parseInt(getValue('flatFee'))) : null;
    const amountPaid = BigInt(parseInt(getValue('amountPaid')) || 0);

    const servicesStr = getValue('services');
    const services: Service[] = servicesStr
      ? servicesStr.split(',').map(s => ({
          name: s.trim(),
          price: BigInt(0),
        }))
      : [];

    let externalId: string | undefined = undefined;
    if (externalIdColumn) {
      const externalIdIndex = headers.indexOf(externalIdColumn);
      if (externalIdIndex >= 0) {
        const idValue = row[externalIdIndex]?.trim();
        if (idValue) {
          externalId = idValue;
        }
      }
    }

    const event: Event = {
      id: BigInt(0),
      externalId,
      title,
      dateRange: {
        from: dateTimestamp,
        to: dateTimestamp,
      },
      sports: [],
      services,
      attendees,
      pricePerPerson,
      flatFee: flatFee !== null ? flatFee : undefined,
      amountPaid,
      createdAt: BigInt(Date.now() * 1_000_000),
      lastModified: BigInt(Date.now() * 1_000_000),
    };

    return { success: true, event };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' };
  }
}

function parseDateToTimestamp(dateStr: string): bigint | null {
  try {
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        let year: number, month: number, day: number;

        if (format === formats[0]) {
          [, month, day, year] = match.map(Number);
        } else if (format === formats[1]) {
          [, year, month, day] = match.map(Number);
        } else {
          [, day, month, year] = match.map(Number);
        }

        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          return BigInt(date.getTime() * 1_000_000);
        }
      }
    }

    const timestamp = Date.parse(dateStr);
    if (!isNaN(timestamp)) {
      return BigInt(timestamp * 1_000_000);
    }

    return null;
  } catch {
    return null;
  }
}
