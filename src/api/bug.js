import request from '@/utils/request';

export function getBugList(params) {
  return request({
    url: '/bug/list',
    method: 'get',
    params,
  });
}

export function createBug(data) {
  return request({
    url: '/bug/create',
    method: 'post',
    data,
  });
}

export function updateBug(id, data) {
  return request({
    url: `/bug/${id}`,
    method: 'put',
    data,
  });
}

export function resolveBug(id, data) {
  return request({
    url: `/bug/${id}/resolve`,
    method: 'post',
    data,
  });
}

export function getBugModules() {
  return request({
    url: '/bug/modules',
    method: 'get',
  });
}

export function activateBug(id) {
  return request({
    url: `/bug/${id}/activate`,
    method: 'post',
  });
}

export function deleteBug(id) {
  return request({
    url: `/bug/${id}`,
    method: 'delete',
  });
}

export function batchDeleteBug(ids) {
  return request({
    url: '/bug/batch-delete',
    method: 'post',
    data: { ids },
  });
}
