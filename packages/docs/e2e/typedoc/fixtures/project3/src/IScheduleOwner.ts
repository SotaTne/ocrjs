import type { EntryCollection } from './EntryCollection.js';

export interface IScheduleOwner {
  getEntries(limit: number): EntryCollection;
}
