import { Base } from './Base.js';
import { EntryCollection } from './EntryCollection.js';
import type { IScheduleOwner } from './IScheduleOwner.js';

export class Schedule extends Base implements IScheduleOwner {
  entries = new EntryCollection();

  getEntries(limit: number): EntryCollection {
    void limit;
    return this.entries;
  }
}
