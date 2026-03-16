import request from '@/utils/request';

export function getTaskList(params) {
  return request({
    url: '/task/list',
    method: 'get',
    params,
  });
}

export function createTask(data) {
  return request({
    url: '/task/create',
    method: 'post',
    data,
  });
}

export function updateTask(id, data) {
  return request({
    url: `/task/${id}`,
    method: 'put',
    data,
  });
}

export function deleteTask(id) {
  return request({
    url: `/task/${id}`,
    method: 'delete',
  });
}
