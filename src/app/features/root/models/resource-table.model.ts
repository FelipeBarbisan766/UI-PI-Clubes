export type FieldType = 'text' | 'number' | 'boolean' | 'select';
export type FieldDisplay = 'text' | 'status' | 'code' | 'progress';

export interface Field<T> {
  key: keyof T & string;
  label: string;
  type?: FieldType;
  options?: readonly string[];
  display?: FieldDisplay;
  format?: (row: T) => string;
  hideInTable?: boolean;
  hideInForm?: boolean;
}
