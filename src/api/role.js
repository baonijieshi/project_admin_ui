import request from '@/utils/request';

export function getRoleList() {
  return request({ url: '/profile/list', method: 'get' });
}

export function createRole(data) {
  return request({ url: '/profile/create', method: 'post', data });
}

export function updateRole(id, data) {
  return request({ url: `/profile/${id}`, method: 'put', data });
}

export function deleteRole(id) {
  return request({ url: `/profile/${id}`, method: 'delete' });
}

export function saveRolePermissions(id, permissions) {
  return request({ url: `/profile/${id}/permissions`, method: 'put', data: { permissions } });
}

export function getMenuTree() {
  return request({ url: '/profile/menu/list', method: 'get' });
}

export function createMenu(data) {
  return request({ url: '/profile/menu/create', method: 'post', data });
}

export function updateMenu(id, data) {
  return request({ url: `/profile/menu/${id}`, method: 'put', data });
}

export function deleteMenu(id) {
  return request({ url: `/profile/menu/${id}`, method: 'delete' });
}
