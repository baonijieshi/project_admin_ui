import request from '@/utils/request';

export function getVersionList(params) {
  return request({
    url: '/profile/version/list',
    method: 'get',
    params,
  });
}

export function createVersion(data) {
  return request({
    url: '/profile/version/create',
    method: 'post',
    data,
  });
}

export function updateVersion(id, data) {
  return request({
    url: `/profile/version/${id}`,
    method: 'put',
    data,
  });
}

export function deleteVersion(id) {
  return request({
    url: `/profile/version/${id}`,
    method: 'delete',
  });
}

export function getVersionDetail(id, params) {
  return request({
    url: `/profile/version/${id}/detail`,
    method: 'get',
    params,
  });
}
