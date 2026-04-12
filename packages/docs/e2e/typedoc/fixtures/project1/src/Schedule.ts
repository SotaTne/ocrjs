import { Base } from './Base.js';
import type { Entry } from './Entry.js';
import type { IScheduleOwner } from './IScheduleOwner.js';

export class Schedule extends Base implements IScheduleOwner {
  entries: Array<Entry> = [];
}
