import request from '@/utils/request';

export function getVersionList(params) {
  return request({
    url: '/profile/version/list',
    method: 'get',
    params,
  });
}

export function getVersionGrouped(params) {
  return request({
    url: '/profile/version/grouped',
    method: 'get',
    params,
  });
}

export function getVersionByQuarter(params) {
  return request({
    url: '/profile/version/by-quarter',
    method: 'get',
    params,
  });
}

export function getVersionPersonGrouped(params) {
  return request({
    url: '/profile/version/person-grouped',
    method: 'get',
    params,
  });
}

export function getVersionByPerson(params) {
  return request({
    url: '/profile/version/by-person',
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

export function pullFeishuVersions() {
  return request({
    url: '/profile/version/pull-feishu',
    method: 'post',
  });
}

export function archiveVersion(id) {
  return request({
    url: `/profile/version/${id}/archive`,
    method: 'post',
  });
}
