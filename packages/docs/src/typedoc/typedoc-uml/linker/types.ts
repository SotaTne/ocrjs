import type { PageHeading } from 'typedoc';
import type { ReflectionID } from '../types.js';

export type ReflectionAbsoluteLink = {
  absoluteLink: string;
  pageUrl: string;
  anchor?: string;
};

export type ReflectionLinkStoreMap = Map<ReflectionID, ReflectionAbsoluteLink>;

export type ReflectionLike = {
  id: ReflectionID;
  name: string;
  hasOwnPage?: boolean;
  children?: Array<ReflectionLike | undefined> | undefined;
};

export type LinkPageEvent = {
  url: string;
  model: ReflectionLike;
  pageHeadings: PageHeading[];
};
