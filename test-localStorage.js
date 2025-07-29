console.log('Testing localStorage access...');
try {
  localStorage.setItem('test', 'test');
  console.log('localStorage works');
} catch (e) {
  console.error('localStorage error:', e);
}
