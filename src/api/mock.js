import request from '@/utils/request';

export function getMockList(params) {
  return request({
    url: '/mock/list',
    method: 'get',
    params,
  });
}

export function createMock(data) {
  return request({
    url: '/mock/create',
    method: 'post',
    data,
  });
}

export function deleteMock(snowId) {
  return request({
    url: `/mock/${snowId}`,
    method: 'delete',
  });
}
