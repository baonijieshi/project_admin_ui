import request from '@/utils/request';

export function getProductList(params) {
  return request({
    url: '/product/list',
    method: 'get',
    params,
  });
}

export function createProduct(data) {
  return request({
    url: '/product/create',
    method: 'post',
    data,
  });
}

export function updateProduct(id, data) {
  return request({
    url: `/product/${id}`,
    method: 'put',
    data,
  });
}

export function deleteProduct(id) {
  return request({
    url: `/product/${id}`,
    method: 'delete',
  });
}
