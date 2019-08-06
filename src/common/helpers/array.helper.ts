export function pluck<T, K>(array: T[], key: string): K[] {
  // tslint:disable-next-line: no-unsafe-any
  return array.map(a => a[key]);
}
