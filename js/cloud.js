const extraImageInput = document.getElementById('extra_image');

extraImageInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const fd = new FormData();
        fd.append('image_file', file);

        const response = await fetch('api/upload.php', { method: 'POST', body: fd });
        const result = await response.json();

        console.log('Upload result:', result); // ← здесь увидишь ошибки или успех

        if (result.error) {
            alert('Upload failed: ' + result.error);
        } else {
            alert('Upload success');
        }
    } catch (error) {
        console.error('Fetch failed:', error);
    }
});