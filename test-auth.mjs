
const host = 'admin.localhost:3000';
console.log('Testing ' + host);
const res1 = await fetch('http://' + host + '/api/auth/csrf');
const data1 = await res1.json();
console.log('CSRF:', data1);
const cookies = res1.headers.getSetCookie();
console.log('Cookies:', cookies);

