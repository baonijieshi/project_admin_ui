import request from '@/utils/request';

export function getModuleList(params) {
  return request({ url: '/profile/module/list', method: 'get', params });
}

export function getModuleFlatList() {
  return request({ url: '/profile/module/flat', method: 'get' });
}

export function createModule(data) {
  return request({ url: '/profile/module/create', method: 'post', data });
}

export function updateModule(id, data) {
  return request({ url: `/profile/module/${id}`, method: 'put', data });
}

export function deleteModule(id) {
  return request({ url: `/profile/module/${id}`, method: 'delete' });
}
