import request from '@/utils/request';

export function getTestcaseList(params) {
  return request({
    url: '/testcase/list',
    method: 'get',
    params,
  });
}

export function createTestcase(data) {
  return request({
    url: '/testcase/create',
    method: 'post',
    data,
  });
}

export function updateTestcase(id, data) {
  return request({
    url: `/testcase/${id}`,
    method: 'put',
    data,
  });
}

export function deleteTestcase(id) {
  return request({
    url: `/testcase/${id}`,
    method: 'delete',
  });
}

export function runTestcase(id, data) {
  return request({
    url: `/testcase/${id}/run`,
    method: 'post',
    data,
  });
}

export function getTestcaseModules() {
  return request({
    url: '/testcase/modules',
    method: 'get',
  });
}

export function importXmind(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request({
    url: '/testcase/import',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}

export function getTemplateUrl() {
  return '/api/testcase/template';
}

export function addToBaseline(ids) {
  return request({
    url: '/testcase/add-to-baseline',
    method: 'post',
    data: { ids },
  });
}

export function importFromBaseline(ids, versionId) {
  return request({
    url: '/testcase/import-from-baseline',
    method: 'post',
    data: { ids, version_id: versionId },
  });
}
