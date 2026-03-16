import request from '@/utils/request';

export function getStoryList(params) {
  return request({
    url: '/story/list',
    method: 'get',
    params,
  });
}

export function createStory(data) {
  return request({
    url: '/story/create',
    method: 'post',
    data,
  });
}

export function updateStory(id, data) {
  return request({
    url: `/story/${id}`,
    method: 'put',
    data,
  });
}

export function deleteStory(id) {
  return request({
    url: `/story/${id}`,
    method: 'delete',
  });
}

export function getStoryComments(storyId) {
  return request({
    url: `/story/${storyId}/comments`,
    method: 'get',
  });
}

export function createStoryComment(storyId, data) {
  return request({
    url: `/story/${storyId}/comments`,
    method: 'post',
    data,
  });
}

export function deleteStoryComment(commentId) {
  return request({
    url: `/story/comments/${commentId}`,
    method: 'delete',
  });
}
