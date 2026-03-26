import request from '@/utils/request';

export function getNotificationList(params) {
  return request({ url: '/notification/list/', method: 'get', params });
}

export function getUnreadCount() {
  return request({ url: '/notification/unread-count/', method: 'get' });
}

export function markAsRead(id) {
  return request({ url: `/notification/${id}/read/`, method: 'post' });
}

export function markAllAsRead() {
  return request({ url: '/notification/read-all/', method: 'post' });
}

export function clearAll() {
  return request({ url: '/notification/clear-all/', method: 'post' });
}
