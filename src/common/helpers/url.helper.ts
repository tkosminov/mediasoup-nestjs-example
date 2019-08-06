import config from 'config';
import { stringify } from 'query-string';

const appSettings = config.get<IAppSettings>('APP_SETTINGS');

/**
 * Подставляет clint и query в юрл.
 * @param {string} url юрл-ресурса
 * @param {object} query query-параметры
 * @returns {string} url.
 */
export const createUrlWithQuery = (url: string, query: object = {}): string => {
  return `${url}?${stringify({ ...appSettings.client })}&${stringify({ ...query })}`;
};
