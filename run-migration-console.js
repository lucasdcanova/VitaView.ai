// Execute this in the browser console while logged in to run the migration
fetch('/api/run-prescription-migration', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
})
    .then(res => res.json())
    .then(data => console.log('Migration result:', data))
    .catch(err => console.error('Migration error:', err));
