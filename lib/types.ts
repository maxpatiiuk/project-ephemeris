// Record
import { error } from './assert';

export type R<V> = Record<string, V>;
// Immutable record
export type IR<V> = Readonly<Record<string, V>>;
// Immutable record of any type
export type RR<K extends string | number | symbol, V> = Readonly<Record<K, V>>;
// Immutable Array
export type RA<V> = readonly V[];

export type Input = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export const defined = <T>(value: T | undefined): T =>
  typeof value === 'undefined' ? error('Value is undefined') : value;
