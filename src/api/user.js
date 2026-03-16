import request from '@/utils/request';

export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data,
  });
}

export function getInfo(token) {
  return request({
    url: '/user/info',
    method: 'get',
    params: { token },
  });
}

export function getMenus() {
  return request({ url: '/user/menus', method: 'get' });
}

export function logout() {
  return request({
    url: '/user/logout',
    method: 'post',
  });
}

export function getUserList() {
  return request({
    url: '/user/list',
    method: 'get',
  });
}

export function updateAvatar(avatar) {
  return request({
    url: '/user/avatar',
    method: 'patch',
    data: { avatar },
  });
}
