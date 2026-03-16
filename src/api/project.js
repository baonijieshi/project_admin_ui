import request from '@/utils/request';

export function getProjectList(params) {
  return request({
    url: '/project/list',
    method: 'get',
    params,
  });
}

export function createProject(data) {
  return request({
    url: '/project/create',
    method: 'post',
    data,
  });
}

export function updateProject(id, data) {
  return request({
    url: `/project/${id}`,
    method: 'put',
    data,
  });
}

export function deleteProject(id) {
  return request({
    url: `/project/${id}`,
    method: 'delete',
  });
}
