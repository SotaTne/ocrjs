import type { EntryCollection } from './EntryCollection.js';

export interface IScheduleOwner {
  getEntries(): EntryCollection;
}
