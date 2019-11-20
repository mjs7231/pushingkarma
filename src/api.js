import axios from 'axios';
export let isCancel = axios.isCancel;

export function cancel(source) {
  if (source) { source.cancel('Cancelled request'); }
  return axios.CancelToken.source();
}

export const Users =  {
  getCurrentUser() { return axios.get('/api/user'); },
  login(data) { return axios.post('/api/user/login', data); },
  logout() { return axios.post('/api/user/logout'); },
  generateToken() { return axios.post('/api/user/gentoken'); },
};

export const Notes = {
  getNote(id) { return axios.get(`/api/notes/${id}`); },
  getNotes(params, cancelToken) { return axios.get('/api/notes', {params, cancelToken}); },
  saveNote(id, data) { return axios.put(`/api/notes/${id}`, data); },
};

export const Budget = {
  getAccounts() { return axios.get('/api/accounts'); },
  getCategories() { return axios.get('/api/categories'); },
  getTransactions(params, cancelToken) { return axios.get('/api/transactions', {params, cancelToken}); },
  getKeyVals() { axios.get('/api/keyval'); },
  saveTransaction(id, data) { return axios.put(`/api/transactions/${id}`, data); },
  upload(data) { return axios.put('/api/transactions/upload', {data}); },
};


