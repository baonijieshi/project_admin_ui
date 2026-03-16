import request from '@/utils/request';

export function getDeptList(params) {
  return request({ url: '/profile/dept/list', method: 'get', params });
}

export function createDept(data) {
  return request({ url: '/profile/dept/create', method: 'post', data });
}

export function updateDept(id, data) {
  return request({ url: `/profile/dept/${id}`, method: 'put', data });
}

export function deleteDept(id) {
  return request({ url: `/profile/dept/${id}`, method: 'delete' });
}
