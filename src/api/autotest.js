import request from '@/utils/request';

// 场景
export function getSceneList(params) {
  return request({ url: '/autotest/scenes', method: 'get', params });
}

export function createScene(data) {
  return request({ url: '/autotest/scenes/create', method: 'post', data });
}

export function getSceneDetail(id) {
  return request({ url: `/autotest/scenes/${id}`, method: 'get' });
}

export function updateScene(id, data) {
  return request({ url: `/autotest/scenes/${id}`, method: 'put', data });
}

export function deleteScene(id) {
  return request({ url: `/autotest/scenes/${id}`, method: 'delete' });
}

export function runScene(id, data) {
  return request({ url: `/autotest/scenes/${id}/run`, method: 'post', data });
}

// 报告
export function getReportList(params) {
  return request({ url: '/autotest/reports', method: 'get', params });
}

export function getReportDetail(id) {
  return request({ url: `/autotest/reports/${id}`, method: 'get' });
}

export function deleteReport(id) {
  return request({ url: `/autotest/reports/${id}`, method: 'delete' });
}

// Faker 动态变量
export function getFakerVars() {
  return request({ url: '/autotest/faker-vars', method: 'get' });
}
